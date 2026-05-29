#ifndef LOGIC_H
#define LOGIC_H

#include <stdbool.h>

char* extract_block_html_from_file(const char* path_from);
bool extract_block_html_to_file(const char* path_from, const char* path_to);

#endif
