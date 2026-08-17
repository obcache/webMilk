cmake_minimum_required(VERSION 3.24)

project(webmilk_projectm_wasm LANGUAGES C CXX)

set(PROJECTM_ROOT "" CACHE PATH "Path to the local ProjectM source checkout")

if(NOT PROJECTM_ROOT)
    message(FATAL_ERROR "PROJECTM_ROOT is required. Pass -DPROJECTM_ROOT=/path/to/projectm")
endif()

if(NOT EXISTS "${PROJECTM_ROOT}/CMakeLists.txt")
    message(FATAL_ERROR "PROJECTM_ROOT does not point to a ProjectM checkout: ${PROJECTM_ROOT}")
endif()

set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
set(BUILD_TESTING OFF CACHE BOOL "" FORCE)
set(BUILD_DOCS OFF CACHE BOOL "" FORCE)
set(ENABLE_INSTALL OFF CACHE BOOL "" FORCE)
set(ENABLE_PLAYLIST OFF CACHE BOOL "" FORCE)
set(ENABLE_SDL_UI OFF CACHE BOOL "" FORCE)
set(ENABLE_VERBOSE_LOGGING OFF CACHE BOOL "" FORCE)

add_subdirectory("${PROJECTM_ROOT}" projectm EXCLUDE_FROM_ALL)

add_executable(webmilk-projectm
    bindings.cpp
)

target_compile_features(webmilk-projectm PRIVATE cxx_std_17)
target_link_libraries(webmilk-projectm PRIVATE projectM)
target_include_directories(webmilk-projectm PRIVATE
    "${PROJECTM_ROOT}/src/api/include"
)

if(EMSCRIPTEN)
    target_link_options(webmilk-projectm PRIVATE
        "SHELL:-s MODULARIZE=1"
        "SHELL:-s EXPORT_ES6=1"
        "SHELL:-s EXPORT_NAME=createWebMilkProjectMModule"
        "SHELL:-s ENVIRONMENT=web,worker"
        "SHELL:-s USE_SDL=2"
        "SHELL:-s MIN_WEBGL_VERSION=2"
        "SHELL:-s MAX_WEBGL_VERSION=2"
        "SHELL:-s FULL_ES2=1"
        "SHELL:-s FULL_ES3=1"
        "SHELL:-s ALLOW_MEMORY_GROWTH=1"
        "SHELL:-s NO_DISABLE_EXCEPTION_CATCHING"
        "SHELL:-s EXPORTED_RUNTIME_METHODS=['ccall','cwrap','HEAPU8','HEAPF32']"
        "SHELL:-s EXPORTED_FUNCTIONS=['_malloc','_free','_webmilk_projectm_init_webgl_context','_webmilk_projectm_create','_webmilk_projectm_destroy','_webmilk_projectm_load_preset_data','_webmilk_projectm_set_window_size','_webmilk_projectm_set_fps','_webmilk_projectm_set_frame_time','_webmilk_projectm_set_preset_locked','_webmilk_projectm_set_preset_start_clean','_webmilk_projectm_pcm_add_float','_webmilk_projectm_opengl_render_frame','_webmilk_projectm_opengl_render_frame_fbo']"
    )
endif()
