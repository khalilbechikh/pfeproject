#!/bin/bash

# Script to fork (clone) a bare Git repository.
# Usage: ./forkGitRepo.sh <source_repo_path> <target_repo_path>

set -e # Exit immediately if a command exits with a non-zero status.

SOURCE_REPO_PATH="$1"
TARGET_REPO_PATH="$2"

# --- Input Validation ---
if [ -z "$SOURCE_REPO_PATH" ]; then
  echo "Error: Source repository path is required."
  exit 1
fi

if [ -z "$TARGET_REPO_PATH" ]; then
  echo "Error: Target repository path is required."
  exit 1
fi

if [ ! -d "$SOURCE_REPO_PATH" ]; then
  echo "Error: Source repository path '$SOURCE_REPO_PATH' does not exist or is not a directory."
  exit 1
fi

# Check if target directory's parent exists
TARGET_PARENT_DIR=$(dirname "$TARGET_REPO_PATH")
if [ ! -d "$TARGET_PARENT_DIR" ]; then
    echo "Error: Parent directory for target '$TARGET_PARENT_DIR' does not exist."
    exit 1
fi

if [ -e "$TARGET_REPO_PATH" ]; then
  echo "Error: Target path '$TARGET_REPO_PATH' already exists."
  exit 1
fi

# --- Forking Operation ---
echo "Cloning bare repository from '$SOURCE_REPO_PATH' to '$TARGET_REPO_PATH'..."
git clone --bare "$SOURCE_REPO_PATH" "$TARGET_REPO_PATH"

if [ $? -ne 0 ]; then
  echo "Error: Failed to clone repository."
  # Attempt cleanup if clone failed partially
  rm -rf "$TARGET_REPO_PATH"
  exit 1
fi

# Optional: Adjust permissions if needed, e.g., chown -R git:git "$TARGET_REPO_PATH"
# This depends on how your git server user/group is configured.

echo "Repository forked successfully to '$TARGET_REPO_PATH'."
exit 0
