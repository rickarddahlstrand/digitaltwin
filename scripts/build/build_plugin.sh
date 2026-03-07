#!/usr/bin/env bash
# Build script for 3D Tiles for Godot plugin (macOS ARM64)
# Clones the Battle Road Labs repo, checks out the macOS support branch,
# builds the plugin, and copies it into the project's addons/ directory.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TMP_DIR="$SCRIPT_DIR/tmp"
REPO_URL="https://github.com/johann-taberlet/3D-Tiles-For-Godot.git"
BRANCH="feat/macos-support"
ADDON_DIR="$PROJECT_ROOT/addons/cesium_godot"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

check_prerequisites() {
    local missing=0

    if ! command -v cmake &> /dev/null; then
        log_error "cmake not found. Install with: brew install cmake"
        missing=1
    fi

    if ! command -v scons &> /dev/null; then
        log_error "scons not found. Install with: brew install scons"
        missing=1
    fi

    if ! command -v python3 &> /dev/null; then
        log_error "python3 not found. Install with: brew install python"
        missing=1
    fi

    if ! xcode-select -p &> /dev/null; then
        log_error "Xcode Command Line Tools not found. Install with: xcode-select --install"
        missing=1
    fi

    if ! command -v git &> /dev/null; then
        log_error "git not found."
        missing=1
    fi

    if [ $missing -ne 0 ]; then
        log_error "Missing prerequisites. Install them and try again."
        exit 1
    fi

    log_info "All prerequisites satisfied."
}

clone_repo() {
    if [ -d "$TMP_DIR/3D-Tiles-For-Godot" ]; then
        log_info "Previous clone found, removing..."
        rm -rf "$TMP_DIR/3D-Tiles-For-Godot"
    fi

    mkdir -p "$TMP_DIR"
    log_info "Cloning $REPO_URL..."
    git clone --branch "$BRANCH" --recurse-submodules "$REPO_URL" "$TMP_DIR/3D-Tiles-For-Godot"
    log_info "Checked out branch: $BRANCH"
}

build_plugin() {
    cd "$TMP_DIR/3D-Tiles-For-Godot"

    log_info "Initializing submodules..."
    git submodule update --init --recursive

    log_info "Building plugin for macOS ARM64..."
    scons arch=arm64 compileTarget=extension target=template_release buildCesium=yes

    log_info "Build complete."
}

install_plugin() {
    local build_addon_dir="$TMP_DIR/3D-Tiles-For-Godot/godot3dtiles/addons/cesium_godot"

    if [ ! -d "$build_addon_dir" ]; then
        log_error "Built addon not found at $build_addon_dir"
        log_warn "Checking alternative locations..."

        # Try other common locations
        for candidate in \
            "$TMP_DIR/3D-Tiles-For-Godot/project/addons/cesium_godot" \
            "$TMP_DIR/3D-Tiles-For-Godot/addons/cesium_godot"; do
            if [ -d "$candidate" ]; then
                build_addon_dir="$candidate"
                log_info "Found addon at $candidate"
                break
            fi
        done

        if [ ! -d "$build_addon_dir" ]; then
            log_error "Could not find built addon directory. Check build output."
            exit 1
        fi
    fi

    log_info "Installing plugin to $ADDON_DIR..."
    rm -rf "$ADDON_DIR"
    cp -R "$build_addon_dir" "$ADDON_DIR"
    log_info "Plugin installed successfully."
}

cleanup() {
    log_info "Cleaning up build files..."
    rm -rf "$TMP_DIR"
    log_info "Cleanup complete."
}

main() {
    log_info "=== 3D Tiles for Godot - macOS ARM64 Build ==="
    log_info "Project root: $PROJECT_ROOT"
    echo ""

    check_prerequisites
    clone_repo
    build_plugin
    install_plugin
    cleanup

    echo ""
    log_info "=== Build and installation complete ==="
    log_info "Open the project in Godot 4.5 to verify the plugin loads correctly."
}

main "$@"
