#!/bin/bash

# fix min.js line ending after terser processing
unix2dos -q "./_assets/js/main.min.js"

# powershell better handles multiline string..
powershell.exe -ExecutionPolicy ByPass -File 'build.ps1'

# fix encoding and line ending
mapfile -t files < <(find ../docs -type f -iwholename "*.html")
for file in "${files[@]}"; do
  sed -i '1s/^\xEF\xBB\xBF//' "$file"
  unix2dos -q "$file"
done

echo "Build completed"
