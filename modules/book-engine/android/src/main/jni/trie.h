#ifndef TRIE_H
#define TRIE_H

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef struct TrieNode {
    uint32_t key;
    int color_code;
    int note_count;
    int64_t* note_ids;
    struct TrieNode** children;
    uint32_t child_count;
    uint32_t child_cap;
} TrieNode;

typedef struct ArenaBlock ArenaBlock;

typedef struct {
    TrieNode* root;
    ArenaBlock* blocks;
} Trie;

typedef struct {
    char* data;
    size_t length;
    size_t capacity;
} StringBuffer;

StringBuffer* sb_create(size_t initial_cap);
void sb_append(StringBuffer* sb, const char* str, size_t len);
void sb_append_char(StringBuffer* sb, char c);

Trie* trie_create(void);
bool trie_insert(Trie* trie, const char* word, const int64_t* note_ids, int note_count, int color_code);
TrieNode* trie_search_longest(const Trie* trie, const char* text, size_t* out_len);
void trie_remove_notes(Trie* trie, const int64_t* note_ids, int count);
void trie_free(Trie* trie);

#endif
