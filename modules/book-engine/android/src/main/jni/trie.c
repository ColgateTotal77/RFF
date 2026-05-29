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
    TrieNode* node = calloc(1, sizeof(TrieNode));
    node->note_ids = NULL;
    node->note_count = 0;
    return node;
}

// TODO(20): OOM mid-word leaves partial path — return bool and propagate, or allocate full path first
void trie_insert(TrieNode* root, const char* word, long* note_ids, int note_count, int color_code) {
    TrieNode* curr = root;
    for (int i = 0; word[i] != '\0'; i++) {
        unsigned char c = tolower((unsigned char)word[i]);
        // TODO(29): sibling linked-list is O(n) per byte — use [256] table or hash map
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

    if (curr->note_ids) {
        free(curr->note_ids);
    }

    curr->note_ids = malloc(note_count * sizeof(long));
    if (curr->note_ids) {
        memcpy(curr->note_ids, note_ids, note_count * sizeof(long));
        curr->note_count = note_count;
    } else {
        curr->note_count = 0;
    }
    curr->color_code = color_code;
}

TrieNode* trie_search(TrieNode* root, const char* word, size_t len) {
    TrieNode* curr = root;
    for (size_t i = 0; i < len; i++) {
        unsigned char c = tolower((unsigned char)word[i]);
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

    if (root->note_ids) {
        free(root->note_ids);
    }

    free(root);
}

bool is_word_char_at(const char* p) {
    if (p == NULL || *p == '\0') {
        return false;
    }
    unsigned char c = (unsigned char)*p;
    if (c < 0x80) {
        return isalnum(c) || c == '\'' || c == '-';
    }
    return true;
}
