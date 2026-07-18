#include <jni.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <android/log.h>
#include "trie.h"
#include "utf8.h"
#include "render.h"

Trie* global_dictionary = NULL;

static pthread_rwlock_t dict_lock;
static pthread_once_t dict_lock_once = PTHREAD_ONCE_INIT;

static void dict_lock_init(void) {
    pthread_rwlockattr_t attr;
    pthread_rwlockattr_init(&attr);
    pthread_rwlockattr_setkind_np(&attr, PTHREAD_RWLOCK_PREFER_WRITER_NONRECURSIVE_NP);
    pthread_rwlock_init(&dict_lock, &attr);
    pthread_rwlockattr_destroy(&attr);
}

static void dict_rdlock(void) {
    pthread_once(&dict_lock_once, dict_lock_init);
    pthread_rwlock_rdlock(&dict_lock);
}

static void dict_wrlock(void) {
    pthread_once(&dict_lock_once, dict_lock_init);
    pthread_rwlock_wrlock(&dict_lock);
}

static void dict_unlock(void) {
    pthread_rwlock_unlock(&dict_lock);
}

JNIEXPORT void JNICALL
Java_com_reader_bookengine_AnkiModule_upsertWordToAnkiDictionary(
        JNIEnv* env, jobject thiz, jstring jword, jlongArray noteIds, jint colorCode) {

    const char* word_str = (*env)->GetStringUTFChars(env, jword, 0);
    if (word_str == NULL) return;

    jsize note_count = (*env)->GetArrayLength(env, noteIds);
    jlong* notes = (*env)->GetLongArrayElements(env, noteIds, NULL);

    dict_wrlock();
    bool inserted = global_dictionary != NULL &&
                    trie_insert(global_dictionary, word_str, notes, note_count, colorCode);
    dict_unlock();

    if (!inserted) {
        __android_log_print(ANDROID_LOG_WARN, "BookEngine", "upsertWordToAnkiDictionary: insert failed for '%s'", word_str);
    }

    (*env)->ReleaseLongArrayElements(env, noteIds, notes, JNI_ABORT);
    (*env)->ReleaseStringUTFChars(env, jword, word_str);
}

JNIEXPORT void JNICALL
Java_com_reader_bookengine_AnkiModule_removeNotesFromAnkiDictionary(
        JNIEnv* env, jobject thiz, jlongArray noteIds) {

    jsize note_count = (*env)->GetArrayLength(env, noteIds);
    jlong* notes = (*env)->GetLongArrayElements(env, noteIds, NULL);

    dict_wrlock();
    trie_remove_notes(global_dictionary, notes, note_count);
    dict_unlock();

    (*env)->ReleaseLongArrayElements(env, noteIds, notes, JNI_ABORT);
}

JNIEXPORT void JNICALL
Java_com_reader_bookengine_BookEngineModule_initAnkiDictionary(
    JNIEnv* env, jobject thiz, jobjectArray words, jobjectArray noteIdsArray, jintArray colorCodes) {

    dict_wrlock();

    trie_free(global_dictionary);
    global_dictionary = trie_create();

    if (global_dictionary == NULL) {
        dict_unlock();
        __android_log_print(ANDROID_LOG_WARN, "BookEngine", "initAnkiDictionary: FAILED to allocate root");
        return;
    }

    jsize word_count = (*env)->GetArrayLength(env, words);
    jint* colors = (*env)->GetIntArrayElements(env, colorCodes, NULL);

    for (jsize i = 0; i < word_count; i++) {
        jstring jword = (jstring)(*env)->GetObjectArrayElement(env, words, i);
        const char* word_str = (*env)->GetStringUTFChars(env, jword, 0);

        jlongArray noteIds = (jlongArray)(*env)->GetObjectArrayElement(env, noteIdsArray, i);
        jsize note_count = (*env)->GetArrayLength(env, noteIds);
        jlong* notes = (*env)->GetLongArrayElements(env, noteIds, NULL);

        if (word_str != NULL) {
            trie_insert(global_dictionary, word_str, notes, note_count, colors[i]);
            (*env)->ReleaseStringUTFChars(env, jword, word_str);
        }

        (*env)->ReleaseLongArrayElements(env, noteIds, notes, JNI_ABORT);
        (*env)->DeleteLocalRef(env, jword);
        (*env)->DeleteLocalRef(env, noteIds);
    }

    (*env)->ReleaseIntArrayElements(env, colorCodes, colors, JNI_ABORT);

    dict_unlock();
}

JNIEXPORT void JNICALL
Java_com_reader_bookengine_BookEngineModule_freeAnkiDictionary(JNIEnv* env, jobject thiz) {
    dict_wrlock();
    bool freed = global_dictionary != NULL;
    trie_free(global_dictionary);
    global_dictionary = NULL;
    dict_unlock();

    if (freed) {
        __android_log_print(ANDROID_LOG_DEBUG, "BookEngine", "Anki dictionary freed");
    }
}

JNIEXPORT jstring JNICALL
Java_com_reader_bookengine_BookEngineModule_extractBlockHtml(
    JNIEnv* env, jobject thiz, jstring filePath) {

    const char* path_from = (*env)->GetStringUTFChars(env, filePath, 0);
    if (path_from == NULL) return NULL;

    dict_rdlock();
    char* html = render_block_file(global_dictionary, path_from);
    dict_unlock();

    (*env)->ReleaseStringUTFChars(env, filePath, path_from);

    if (html == NULL) {
        return NULL;
    }

    jstring result = (*env)->NewStringUTF(env, html);
    free(html);
    return result;
}
