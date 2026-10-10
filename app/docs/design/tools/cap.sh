#!/usr/bin/env bash
# cap.sh <name> <url> [dir]  -> <dir>/<name>-1440.png, <name>-390.png (+ -tokens.json)
d=${3:-design-research/refs}; F="$(dirname "$0")/refshot-pw.py"
for v in "1440 900" "390 844"; do set -- "$1" "$2" "$d" $v
  timeout 80 /tmp/pwenv/bin/python "$F" "$2" "$3/$1-$4.png" "$4" "$5" 2>&1 | tail -1; done
