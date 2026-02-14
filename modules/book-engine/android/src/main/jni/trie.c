#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <android/log.h>
#include "trie.h"

StringBuffer* sb_create(size_t initial_cap) {
    StringBuffer* sb = malloc(sizeof(StringBuffer));
    sb->data = malloc(initial_cap);
    sb->data[0] = '\0';
    sb->length = 0;
    sb->capacity = initial_cap;
    return sb;
}

void sb_append(StringBuffer* sb, const char* str, size_t len) {
    if (sb->length + len + 1 > sb->capacity) {
        sb->capacity = (sb->capacity + len) * 2;
        sb->data = realloc(sb->data, sb->capacity);
    }
    memcpy(sb->data + sb->length, str, len);
    sb->length += len;
    sb->data[sb->length] = '\0';
}

void sb_append_char(StringBuffer* sb, char c) {
    sb_append(sb, &c, 1);
}

TrieNode* trie_create_node() {
    return calloc(1, sizeof(TrieNode));
}

void trie_insert(TrieNode* root, const char* word, long note_id, int color_code) {
    TrieNode* curr = root;
    for (int i = 0; word[i] != '\0'; i++) {
        unsigned char c = (unsigned char)word[i];
        TrieChild* child = curr->children;
        TrieNode* next_node = NULL;
        while (child) {
            if (child->character == c) {
                next_node = child->child;
                break;
            }
            child = child->next;
        }
        if (!next_node) {
            TrieChild* new_child = malloc(sizeof(TrieChild));
            if (!new_child) {
                __android_log_print(ANDROID_LOG_DEBUG, "BookEngine", "trie_insert: FAILED to allocate child for character '%c'", c);
                return;
            }
            new_child->character = c;
            new_child->child = trie_create_node();
            new_child->next = curr->children;
            curr->children = new_child;
            next_node = new_child->child;
        }

        curr = next_node;
    }
    curr->note_id = note_id;
    curr->color_code = color_code;
}

TrieNode* trie_search(TrieNode* root, const char* word, size_t len) {
    TrieNode* curr = root;
    for (size_t i = 0; i < len; i++) {
        unsigned char c = (unsigned char)word[i];
        TrieChild* child = curr->children;
        TrieNode* next_node = NULL;

        while (child) {
            if (child->character == c) {
                next_node = child->child;
                break;
            }
            child = child->next;
        }

        if (!next_node) return NULL;
        curr = next_node;
    }
    return curr;
}

void trie_free(TrieNode* root) {
    if (!root) return;

    TrieChild* child = root->children;
    while (child) {
        TrieChild* next = child->next;
        trie_free(child->child);
        free(child);
        child = next;
    }
    free(root);
}

bool is_word_char(unsigned char c) {
    return isalnum(c) || c >= 0x80 || c == '\'';
}
