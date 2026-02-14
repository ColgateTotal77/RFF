#ifndef TRIE_H
#define TRIE_H

#include <stdbool.h>

typedef struct TrieChild {
    unsigned char character;
    struct TrieNode* child;
    struct TrieChild* next;
} TrieChild;

typedef struct TrieNode {
    int color_code;
    long note_id;
    TrieChild* children;
} TrieNode;

typedef struct {
    char* data;
    size_t length;
    size_t capacity;
} StringBuffer;

StringBuffer* sb_create(size_t initial_cap);
void sb_append(StringBuffer* sb, const char* str, size_t len);
void sb_append_char(StringBuffer* sb, char c);
TrieNode* trie_create_node(void);
void trie_insert(TrieNode* root, const char* word, long note_id, int color_code);
TrieNode* trie_search(TrieNode* root, const char* word, size_t len);
void trie_free(TrieNode* root);
bool is_word_char(unsigned char c);

#endif
