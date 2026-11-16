#!/usr/bin/env bash
# Renders the user manual HTML sources to PDF with headless Edge (or Chrome).
# Output goes to src/assets/manual/, which the Dashboard links to.
# Run from Git Bash:  bash docs/user-manual/build.sh
# Needs an internet connection for the Google fonts and Material Icons.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
out="$here/../../src/assets/manual"
mkdir -p "$out"

browser=""
for b in "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" \
         "/c/Program Files/Google/Chrome/Application/chrome.exe"; do
  [ -x "$b" ] && browser="$b" && break
done
[ -n "$browser" ] || { echo "Edge or Chrome not found" >&2; exit 1; }

render() {
  local src="$1" dest="$2"
  "$browser" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=15000 \
    --print-to-pdf="$(cygpath -w "$out/$dest")" \
    "file:///$(cygpath -m "$here/$src")" 2>/dev/null
  echo "Built src/assets/manual/$dest"
}

render manual-en.html Karbar-User-Manual-EN.pdf
[ -f "$here/manual-bn.html" ] && render manual-bn.html Karbar-User-Manual-BN.pdf
