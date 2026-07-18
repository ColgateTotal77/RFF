#include <stdlib.h>
#include <string.h>
#include <android/log.h>
#include "trie.h"
#include "utf8.h"

#define KEY_SPACE ' '
#define ARENA_BLOCK (64 * 1024)

struct ArenaBlock {
    ArenaBlock* next;
    size_t used;
    size_t size;
    char data[];
};

static void* arena_alloc(Trie* trie, size_t size) {
    size = (size + 7) & ~(size_t)7;

    if (!trie->blocks || trie->blocks->used + size > trie->blocks->size) {
        size_t block = size > ARENA_BLOCK ? size : ARENA_BLOCK;
        ArenaBlock* b = malloc(sizeof(ArenaBlock) + block);
        if (!b) return NULL;
        b->next = trie->blocks;
        b->used = 0;
        b->size = block;
        trie->blocks = b;
    }

    void* p = trie->blocks->data + trie->blocks->used;
    trie->blocks->used += size;
    return p;
}

static TrieNode* node_create(Trie* trie, uint32_t key) {
    TrieNode* node = arena_alloc(trie, sizeof(TrieNode));
    if (!node) return NULL;

    memset(node, 0, sizeof(TrieNode));
    node->key = key;
    return node;
}

static bool ends_word(CpClass prev, CpClass next) {
    return prev == CP_UNSPACED || next != CP_ALPHA;
}

static bool child_slot(const TrieNode* node, uint32_t key, uint32_t* slot) {
    uint32_t lo = 0, hi = node->child_count;

    while (lo < hi) {
        uint32_t mid = lo + (hi - lo) / 2;
        if (node->children[mid]->key < key) lo = mid + 1;
        else hi = mid;
    }

    *slot = lo;
    return lo < node->child_count && node->children[lo]->key == key;
}

static TrieNode* trie_child_find(const TrieNode* node, uint32_t key) {
    uint32_t slot;
    return child_slot(node, key, &slot) ? node->children[slot] : NULL;
}

static bool grow_children(Trie* trie, TrieNode* node) {
    uint32_t cap = node->child_cap ? node->child_cap * 2 : 2;
    TrieNode** grown = arena_alloc(trie, cap * sizeof(TrieNode*));
    if (!grown) return false;

    if (node->child_count) {
        memcpy(grown, node->children, node->child_count * sizeof(TrieNode*));
    }
    node->children = grown;
    node->child_cap = cap;
    return true;
}

static TrieNode* trie_child_insert(Trie* trie, TrieNode* node, uint32_t key) {
    uint32_t slot;
    if (child_slot(node, key, &slot)) return node->children[slot];

    if (node->child_count == node->child_cap && !grow_children(trie, node)) return NULL;

    TrieNode* child = node_create(trie, key);
    if (!child) return NULL;

    memmove(&node->children[slot + 1], &node->children[slot],
            (node->child_count - slot) * sizeof(TrieNode*));
    node->children[slot] = child;
    node->child_count++;
    return child;
}

static const char* skip_spaces(const char* p) {
    const char* q;
    while (*p != '\0' && cp_is_space(cp_at(p, &q))) p = q;
    return p;
}

static bool contains(const int64_t* ids, int count, int64_t id) {
    for (int i = 0; i < count; i++) {
        if (ids[i] == id) return true;
    }
    return false;
}

StringBuffer* sb_create(size_t initial_cap) {
    StringBuffer* sb = malloc(sizeof(StringBuffer));
    if (!sb) return NULL;

    sb->data = malloc(initial_cap);
    if (!sb->data) {
        free(sb);
        return NULL;
    }
    sb->data[0] = '\0';
    sb->length = 0;
    sb->capacity = initial_cap;
    return sb;
}

void sb_append(StringBuffer* sb, const char* str, size_t len) {
    if (sb->length + len + 1 > sb->capacity) {
        size_t cap = (sb->capacity + len) * 2;
        char* grown = realloc(sb->data, cap);
        if (!grown) return;
        sb->data = grown;
        sb->capacity = cap;
    }
    memcpy(sb->data + sb->length, str, len);
    sb->length += len;
    sb->data[sb->length] = '\0';
}

void sb_append_char(StringBuffer* sb, char c) {
    sb_append(sb, &c, 1);
}

Trie* trie_create(void) {
    Trie* trie = calloc(1, sizeof(Trie));
    if (!trie) return NULL;

    trie->root = node_create(trie, 0);
    if (!trie->root) {
        free(trie);
        return NULL;
    }
    return trie;
}

bool trie_insert(Trie* trie, const char* word, const int64_t* note_ids, int note_count, int color_code) {
    if (!trie || note_count <= 0) return false;

    TrieNode* curr = trie->root;
    const char* p = word;
    bool pending_space = false;

    while (*p != '\0') {
        uint32_t cp = cp_at(p, &p);

        if (cp_is_space(cp)) {
            pending_space = (curr != trie->root);
            continue;
        }
        if (pending_space) {
            curr = trie_child_insert(trie, curr, KEY_SPACE);
            pending_space = false;
        }
        if (curr) curr = trie_child_insert(trie, curr, cp_fold_key(cp));
        if (!curr) {
            __android_log_print(ANDROID_LOG_WARN, "BookEngine", "trie_insert: out of memory on '%s'", word);
            return false;
        }
    }

    if (curr == trie->root) return false;

    int64_t* ids = malloc((size_t)note_count * sizeof(int64_t));
    if (!ids) return false;

    memcpy(ids, note_ids, (size_t)note_count * sizeof(int64_t));
    free(curr->note_ids);
    curr->note_ids = ids;
    curr->note_count = note_count;
    curr->color_code = color_code;
    return true;
}

TrieNode* trie_search_longest(const Trie* trie, const char* text, size_t* out_len) {
    const TrieNode* curr = trie->root;
    TrieNode* best = NULL;
    size_t best_len = 0;
    const char* p = text;
    const char* q;
    CpClass cls = cp_word_class(p, CP_NONE, &q);

    while (*p != '\0') {
        uint32_t key;

        if (cls == CP_NONE) {
            if (curr == trie->root) break;
            q = skip_spaces(p);
            if (q == p) break;
            key = KEY_SPACE;
        } else {
            key = cp_fold_key(cp_at(p, NULL));
        }

        const TrieNode* next = trie_child_find(curr, key);
        if (!next) break;

        curr = next;
        CpClass consumed = cls;
        p = q;
        cls = cp_word_class(p, consumed, &q);

        if (consumed != CP_NONE && curr->note_count > 0 && ends_word(consumed, cls)) {
            best = (TrieNode*)curr;
            best_len = (size_t)(p - text);
        }
    }

    if (out_len) *out_len = best_len;
    return best;
}

static void node_remove_notes(TrieNode* node, const int64_t* note_ids, int count) {
    int kept = 0;
    for (int i = 0; i < node->note_count; i++) {
        if (!contains(note_ids, count, node->note_ids[i])) {
            node->note_ids[kept++] = node->note_ids[i];
        }
    }
    if (kept == 0 && node->note_ids) {
        free(node->note_ids);
        node->note_ids = NULL;
    }
    node->note_count = kept;

    for (uint32_t i = 0; i < node->child_count; i++) {
        node_remove_notes(node->children[i], note_ids, count);
    }
}

void trie_remove_notes(Trie* trie, const int64_t* note_ids, int count) {
    if (trie) node_remove_notes(trie->root, note_ids, count);
}

static void node_free_notes(TrieNode* node) {
    free(node->note_ids);
    for (uint32_t i = 0; i < node->child_count; i++) {
        node_free_notes(node->children[i]);
    }
}

void trie_free(Trie* trie) {
    if (!trie) return;

    node_free_notes(trie->root);

    ArenaBlock* b = trie->blocks;
    while (b) {
        ArenaBlock* next = b->next;
        free(b);
        b = next;
    }
    free(trie);
}
