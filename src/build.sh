#!/bin/bash
# the build is scripts/build.mjs; this is a shortcut to it
set -e
cd "$(dirname "$0")/.."
npm run build
