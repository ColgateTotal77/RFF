#include <jni.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <ctype.h>
#include <android/log.h>
#include "trie.h"
#include "logic.h"

TrieNode* global_dictionary = NULL;

JNIEXPORT void JNICALL
Java_com_reader_bookengine_AnkiModule_upsertWordToAnkiDictionary(
        JNIEnv* env, jobject thiz, jstring jword, jlongArray noteIds, jint colorCode) {

    if (global_dictionary == NULL) {
        __android_log_print(ANDROID_LOG_DEBUG, "BookEngine", "global_dictionary is NULL");
        return;
    }

    const char* word_str = (*env)->GetStringUTFChars(env, jword, 0);

    jsize note_count = (*env)->GetArrayLength(env, noteIds);
    jlong* notes = (*env)->GetLongArrayElements(env, noteIds, NULL);

    trie_insert(global_dictionary, word_str, notes, note_count, colorCode);

    (*env)->ReleaseLongArrayElements(env, noteIds, notes, JNI_ABORT);
    (*env)->ReleaseStringUTFChars(env, jword, word_str);
}

JNIEXPORT void JNICALL
Java_com_reader_bookengine_BookEngineModule_initAnkiDictionary(
    JNIEnv* env, jobject thiz, jobjectArray words, jobjectArray noteIdsArray, jintArray colorCodes) {

    if (global_dictionary != NULL) {
        trie_free(global_dictionary);
        global_dictionary = NULL;
    }

    global_dictionary = trie_create_node();

    jsize word_count = (*env)->GetArrayLength(env, words);
    jint* colors = (*env)->GetIntArrayElements(env, colorCodes, NULL);

    for (jsize i = 0; i < word_count; i++) {
        jstring jword = (jstring)(*env)->GetObjectArrayElement(env, words, i);
        const char* word_str = (*env)->GetStringUTFChars(env, jword, 0);

        char* lower_word = strdup(word_str);
        for (char* p = lower_word; *p; p++) {
            *p = tolower((unsigned char)*p);
        }

        jlongArray noteIds = (jlongArray)(*env)->GetObjectArrayElement(env, noteIdsArray, i);
        jsize note_count = (*env)->GetArrayLength(env, noteIds);
        jlong* notes = (*env)->GetLongArrayElements(env, noteIds, NULL);

        trie_insert(global_dictionary, lower_word, notes, note_count, colors[i]);

        free(lower_word);
        (*env)->ReleaseLongArrayElements(env, noteIds, notes, JNI_ABORT);
        (*env)->ReleaseStringUTFChars(env, jword, word_str);
        (*env)->DeleteLocalRef(env, jword);
        (*env)->DeleteLocalRef(env, noteIds);
    }

    (*env)->ReleaseIntArrayElements(env, colorCodes, colors, JNI_ABORT);
}

JNIEXPORT void JNICALL
Java_com_reader_bookengine_BookEngineModule_freeAnkiDictionary(JNIEnv* env, jobject thiz) {
    __android_log_print(ANDROID_LOG_DEBUG, "BookEngine", "Try to free anki dictionary");
    if (global_dictionary != NULL) {
        trie_free(global_dictionary);
        global_dictionary = NULL;
        __android_log_print(ANDROID_LOG_DEBUG, "BookEngine", "Anki dictionary freed");
    }
}

// TODO(19): NUL at bytes_read not size; handle short fread; prefer fseeko/ftello for large files
char* extract_block_html_from_file(const char* path_from) {
    FILE* file = fopen(path_from, "rb");
    if (!file) {
        return NULL;
    }

    fseek(file, 0, SEEK_END);
    long size = ftell(file);
    fseek(file, 0, SEEK_SET);

    if (size <= 0) {
        fclose(file);
        return NULL;
    }

    char* buffer = (char*)malloc((size_t)size + 1);
    if (!buffer) {
        fclose(file);
        return NULL;
    }

    size_t bytes_read = fread(buffer, 1, (size_t)size, file);
    buffer[bytes_read] = '\0';
    fclose(file);

    char* content_start = buffer;
    size_t content_length = bytes_read;

    char temp_end_char = content_start[content_length];
    content_start[content_length] = '\0';

    StringBuffer* out = sb_create(content_length * 2);
    const char* p = content_start;

    while (*p != '\0') {
        if (*p == '<') {
            while (*p != '\0' && *p != '>') {
                sb_append_char(out, *p);
                p++;
            }
            if (*p == '>') {
                sb_append_char(out, *p);
                p++;
            }
            continue;
        }

        if (*p == '&') {
            while (*p != '\0' && *p != ';') {
                sb_append_char(out, *p);
                p++;
            }
            if (*p == ';') {
                sb_append_char(out, *p);
                p++;
            }
            continue;
        }

        if (!is_word_char_at(p)) {
            sb_append_char(out, *p);
            p++;
            continue;
        }

        const char* word_start = p;
        while (*p != '\0' && is_word_char_at(p)) {
            p++;
        }
        size_t word_len = p - word_start;

        TrieNode* match = NULL;
        if (global_dictionary != NULL) {
            match = trie_search(global_dictionary, word_start, word_len);
        }

        if (match != NULL && match->note_count > 0) {
            sb_append(out, "<span class=\"anki-word\" data-note-ids=\"[", 40);

            for (int i = 0; i < match->note_count; i++) {
                char note_id_str[32];
                snprintf(note_id_str, sizeof(note_id_str), "%ld", match->note_ids[i]);
                sb_append(out, note_id_str, strlen(note_id_str));

                if (i < match->note_count - 1) {
                    sb_append(out, ",", 1);
                }
            }

            char span_close[64];
            snprintf(span_close, sizeof(span_close), "]\" data-flag=\"%d\">", match->color_code);
            sb_append(out, span_close, strlen(span_close));

            sb_append(out, word_start, word_len);
            sb_append(out, "</span>", 7);
        } else {
            sb_append(out, word_start, word_len);
        }
    }

    content_start[content_length] = temp_end_char;

    char* result = out->data;
    free(out);
    free(buffer);

    return result;
}

bool extract_block_html_to_file(const char* path_from, const char* path_to) {
    char* html = extract_block_html_from_file(path_from);
    if (html == NULL) {
        return false;
    }

    FILE* out_file = fopen(path_to, "wb");
    if (!out_file) {
        free(html);
        return false;
    }

    size_t len = strlen(html);
    bool success = fwrite(html, 1, len, out_file) == len;
    fclose(out_file);
    free(html);

    return success;
}

JNIEXPORT jboolean JNICALL
Java_com_reader_bookengine_BookEngineModule_extractBlockToFile(
    JNIEnv* env, jobject thiz, jstring filePath, jstring outputPath) {

    const char* path_from = (*env)->GetStringUTFChars(env, filePath, 0);
    const char* path_to = (*env)->GetStringUTFChars(env, outputPath, 0);

    bool success = extract_block_html_to_file(path_from, path_to);

    (*env)->ReleaseStringUTFChars(env, filePath, path_from);
    (*env)->ReleaseStringUTFChars(env, outputPath, path_to);

    return success ? JNI_TRUE : JNI_FALSE;
}

JNIEXPORT jstring JNICALL
Java_com_reader_bookengine_BookEngineModule_extractBlockHtml(
    JNIEnv* env, jobject thiz, jstring filePath) {

    const char* path_from = (*env)->GetStringUTFChars(env, filePath, 0);
    char* html = extract_block_html_from_file(path_from);
    (*env)->ReleaseStringUTFChars(env, filePath, path_from);

    if (html == NULL) {
        return NULL;
    }

    jstring result = (*env)->NewStringUTF(env, html);
    free(html);
    return result;
}
