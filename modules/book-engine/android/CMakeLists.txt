cmake_minimum_required(VERSION 3.22.1)
project("book_engine_native")

add_library(book_engine_native SHARED
    src/main/jni/logic.c
    src/main/jni/trie.c
)

find_library(log-lib log)
target_link_libraries(book_engine_native ${log-lib})
