#!/bin/sh
# Compiles *.vert|frag into gen/*_spv.h (uint32_t arrays).
# glslc comes from the Android NDK: $NDK/shader-tools/<host>/glslc
set -e
GLSLC=${GLSLC:-glslc}
mkdir -p gen
mk() {   # $1 = source, $2 = array/header name
  {
    echo "#pragma once"
    echo "#include <cstdint>"
    echo "static const uint32_t $2[] ="
    "$GLSLC" -O -mfmt=c "$1" -o -
    echo ";"
  } > "gen/$2.h"
  echo "generated gen/$2.h"
}
mk vs.vert        vs_spv
mk fs.frag        fs_spv
mk fs_dlss5.frag  fs_dlss5_spv
