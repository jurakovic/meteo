#!/bin/bash
# the build is scripts/build.mjs; this is the old way in to it
set -e
cd "$(dirname "$0")/.."
npm run build
