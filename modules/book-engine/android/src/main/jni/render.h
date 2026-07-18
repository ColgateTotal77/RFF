#ifndef RENDER_H
#define RENDER_H

#include "trie.h"

char* render_block_html(const Trie* dict, const char* html, size_t len);
char* render_block_file(const Trie* dict, const char* path);

#endif
