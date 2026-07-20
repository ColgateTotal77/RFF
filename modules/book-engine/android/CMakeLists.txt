cmake_minimum_required(VERSION 3.22.1)
project("book_engine_native")

add_library(book_engine_native SHARED
    src/main/jni/logic.c
    src/main/jni/render.c
    src/main/jni/trie.c
    src/main/jni/utf8.c
    src/main/jni/utf8proc/utf8proc.c
)

target_compile_options(book_engine_native PRIVATE
    $<$<CONFIG:Release>:-O3 -fvisibility=hidden -fomit-frame-pointer>
)
set_property(TARGET book_engine_native PROPERTY INTERPROCEDURAL_OPTIMIZATION_RELEASE TRUE)

find_library(log-lib log)
target_link_libraries(book_engine_native ${log-lib})

target_link_options(book_engine_native PRIVATE "-Wl,-z,max-page-size=16384")
