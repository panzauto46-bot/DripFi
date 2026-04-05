#!/usr/bin/env bash
set -euo pipefail

if ! grep -qi microsoft /proc/version; then
  echo "Run this script inside Ubuntu on WSL2."
  exit 1
fi

sudo apt-get update
sudo apt-get install -y build-essential ca-certificates curl git jq lz4 unzip wget

arch="$(uname -m)"
case "$arch" in
  x86_64)
    weave_arch="amd64"
    ;;
  aarch64|arm64)
    weave_arch="arm64"
    ;;
  *)
    echo "Unsupported architecture: $arch"
    exit 1
    ;;
esac

latest_tag="$(curl -fsSL https://api.github.com/repos/initia-labs/weave/releases/latest | jq -r '.tag_name')"
if [[ -z "$latest_tag" || "$latest_tag" == "null" ]]; then
  echo "Could not determine the latest Weave release."
  exit 1
fi

archive_url="https://github.com/initia-labs/weave/releases/download/${latest_tag}/weave-${latest_tag#v}-linux-${weave_arch}.tar.gz"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

wget -qO "$tmp_dir/weave.tar.gz" "$archive_url"
tar -xzf "$tmp_dir/weave.tar.gz" -C "$tmp_dir"
sudo install -m 0755 "$tmp_dir/weave" /usr/local/bin/weave

echo
weave version
echo
echo "Bootstrap complete."
echo "Next steps:"
echo "1. Make sure Docker Desktop is open on Windows."
echo "2. In WSL, run: docker version"
echo "3. In WSL, run: weave init"
echo "4. In WSL, run: weave rollup launch"
