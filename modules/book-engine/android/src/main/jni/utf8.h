#ifndef UTF8_H
#define UTF8_H

#include <stdbool.h>
#include <stdint.h>

#define UTF8_MAX_BYTES 4

typedef enum {
    CP_NONE = 0,
    CP_ALPHA,
    CP_UNSPACED,
} CpClass;

uint32_t cp_at(const char* p, const char** next);

CpClass cp_word_class(const char* p, CpClass prev, const char** next);

bool cp_is_space(uint32_t cp);

uint32_t cp_fold_key(uint32_t cp);

#endif
