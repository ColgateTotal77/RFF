#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "render.h"
#include "utf8.h"

#define SPAN_OPEN "<span class=\"anki-word\" data-note-ids=\"["
#define SPAN_CLOSE "</span>"

#define I64_DIGITS_MAX 20
#define I64_CHARS_MAX (I64_DIGITS_MAX + 1)

static char* read_file(const char* path, size_t* out_len) {
    FILE* file = fopen(path, "rb");
    if (!file) return NULL;

    long size = -1;
    if (fseek(file, 0, SEEK_END) == 0) size = ftell(file);
    rewind(file);

    if (size <= 0) {
        fclose(file);
        return NULL;
    }

    char* buffer = malloc((size_t)size + 1);
    if (!buffer) {
        fclose(file);
        return NULL;
    }

    size_t n = fread(buffer, 1, (size_t)size, file);
    fclose(file);
    buffer[n] = '\0';
    *out_len = n;
    return buffer;
}

static void copy_delimited(StringBuffer* out, const char** p, char end) {
    const char* s = *p;

    while (*s != '\0' && *s != end) s++;
    if (*s == end) s++;

    sb_append(out, *p, (size_t)(s - *p));
    *p = s;
}

static const char* skip_word(const char* p, CpClass cls) {
    const char* q;

    cp_at(p, &q);
    p = q;
    if (cls != CP_ALPHA) return p;

    while (cp_word_class(p, CP_ALPHA, &q) == CP_ALPHA) p = q;
    return p;
}

static size_t write_i64(char* buf, int64_t value) {
    char digits[I64_DIGITS_MAX];
    size_t n = 0;
    uint64_t u = value < 0 ? (uint64_t)(-(value + 1)) + 1 : (uint64_t)value;

    do {
        digits[n++] = (char)('0' + (u % 10));
        u /= 10;
    } while (u);

    size_t len = 0;
    if (value < 0) buf[len++] = '-';
    while (n) buf[len++] = digits[--n];
    return len;
}

static void emit_match(StringBuffer* out, const TrieNode* match, const char* word, size_t len) {
    char num[I64_CHARS_MAX];

    sb_append(out, SPAN_OPEN, sizeof(SPAN_OPEN) - 1);

    for (int i = 0; i < match->note_count; i++) {
        if (i) sb_append_char(out, ',');
        size_t n = write_i64(num, match->note_ids[i]);
        sb_append(out, num, n);
    }

    sb_append(out, "]\" data-flag=\"", 14);
    size_t n = write_i64(num, match->color_code);
    sb_append(out, num, n);
    sb_append(out, "\">", 2);

    sb_append(out, word, len);
    sb_append(out, SPAN_CLOSE, sizeof(SPAN_CLOSE) - 1);
}

char* render_block_html(const Trie* dict, const char* html, size_t len) {
    StringBuffer* out = sb_create(len * 2 + 1);
    if (!out) return NULL;

    const char* p = html;

    while (*p != '\0') {
        if (*p == '<') {
            copy_delimited(out, &p, '>');
            continue;
        }
        if (*p == '&') {
            copy_delimited(out, &p, ';');
            continue;
        }

        CpClass cls = cp_word_class(p, CP_NONE, NULL);
        if (cls == CP_NONE) {
            const char* run = p;
            do {
                p++;
            } while (*p != '\0' && *p != '<' && *p != '&' &&
                     cp_word_class(p, CP_NONE, NULL) == CP_NONE);

            sb_append(out, run, (size_t)(p - run));
            continue;
        }

        size_t match_len = 0;
        TrieNode* match = dict ? trie_search_longest(dict, p, &match_len) : NULL;

        if (match && match->note_count > 0) {
            emit_match(out, match, p, match_len);
            p += match_len;
        } else {
            const char* end = skip_word(p, cls);
            sb_append(out, p, (size_t)(end - p));
            p = end;
        }
    }

    char* result = out->data;
    free(out);
    return result;
}

char* render_block_file(const Trie* dict, const char* path) {
    size_t len = 0;
    char* buffer = read_file(path, &len);
    if (!buffer) return NULL;

    char* result = render_block_html(dict, buffer, len);
    free(buffer);
    return result;
}
