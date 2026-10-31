cmake_minimum_required(VERSION 3.18)
project(foxpostfx CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

include(FetchContent)
set(DOBBY_GENERATE_SHARED OFF CACHE BOOL "" FORCE)
set(DOBBY_DEBUG OFF CACHE BOOL "" FORCE)
FetchContent_Declare(dobby
  GIT_REPOSITORY https://github.com/jmpews/Dobby.git
  GIT_TAG master)
FetchContent_MakeAvailable(dobby)

add_library(foxpostfx SHARED postfx.cpp)
target_include_directories(foxpostfx PRIVATE
  ${CMAKE_SOURCE_DIR}/gen
  ${dobby_SOURCE_DIR}/include)
target_link_libraries(foxpostfx PRIVATE dobby log)
set_target_properties(foxpostfx PROPERTIES LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR})
