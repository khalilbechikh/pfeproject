#!/bin/bash

# Script to merge a branch from a source repo into a target bare repo.
# This version attempts a fast-forward merge by updating the target ref.
# Usage: ./mergeGitBranches.sh <target_repo_path> <source_repo_path_or_url> <source_branch> <target_branch>

set -e # Exit immediately if a command exits with a non-zero status.

TARGET_REPO_PATH="$1"
SOURCE_REPO_PATH="$2" # Can be a local path or a URL
SOURCE_BRANCH="$3"
TARGET_BRANCH="$4"
TEMP_REMOTE_NAME="temp_merge_source_$$" # Unique temporary remote name using PID

# --- Input Validation ---
if [ -z "$TARGET_REPO_PATH" ]; then
  echo "Error: Target repository path is required."
  exit 1
fi
if [ ! -d "$TARGET_REPO_PATH" ]; then
  echo "Error: Target repository path '$TARGET_REPO_PATH' does not exist or is not a directory."
  exit 1
fi
if [ -z "$SOURCE_REPO_PATH" ]; then
  echo "Error: Source repository path/URL is required."
  exit 1
fi
if [ -z "$SOURCE_BRANCH" ]; then
  echo "Error: Source branch name is required."
  exit 1
fi
if [ -z "$TARGET_BRANCH" ]; then
  echo "Error: Target branch name is required."
  exit 1
fi

# --- Merge Operation ---
echo "Attempting to merge '$SOURCE_BRANCH' from '$SOURCE_REPO_PATH' into '$TARGET_BRANCH' in '$TARGET_REPO_PATH'..."

# Store current directory and navigate to target repo
ORIGINAL_DIR=$(pwd)
cd "$TARGET_REPO_PATH" || exit 1

# Cleanup function to remove remote and return to original directory
cleanup() {
  echo "Cleaning up temporary remote '$TEMP_REMOTE_NAME'..."
  git remote remove "$TEMP_REMOTE_NAME" || echo "Warning: Failed to remove temporary remote '$TEMP_REMOTE_NAME'. It might not exist."
  cd "$ORIGINAL_DIR" || exit 1
}
# Ensure cleanup runs on script exit or interruption
trap cleanup EXIT SIGINT SIGTERM

# Add the source repository as a temporary remote
echo "Adding temporary remote '$TEMP_REMOTE_NAME' for '$SOURCE_REPO_PATH'..."
git remote add "$TEMP_REMOTE_NAME" "$SOURCE_REPO_PATH"
if [ $? -ne 0 ]; then
  echo "Error: Failed to add temporary remote '$TEMP_REMOTE_NAME'."
  exit 1
fi

# Fetch the specific source branch
echo "Fetching source branch '$SOURCE_BRANCH' from remote '$TEMP_REMOTE_NAME'..."
# Use --no-tags to avoid fetching unnecessary tags
# Use --depth=1 if you only need the latest commit, but a full fetch is safer for merging history
git fetch "$TEMP_REMOTE_NAME" "$SOURCE_BRANCH" --no-tags
if [ $? -ne 0 ]; then
  echo "Error: Failed to fetch source branch '$SOURCE_BRANCH' from '$TEMP_REMOTE_NAME'."
  exit 1
fi

# Get the commit hash of the fetched branch head
FETCHED_HEAD_HASH=$(git rev-parse "refs/remotes/$TEMP_REMOTE_NAME/$SOURCE_BRANCH")
if [ -z "$FETCHED_HEAD_HASH" ]; then
    echo "Error: Could not find fetched commit hash for $TEMP_REMOTE_NAME/$SOURCE_BRANCH."
    exit 1
fi
echo "Fetched head commit hash: $FETCHED_HEAD_HASH"

# Check if the target branch exists. If not, create it pointing to the fetched head.
if ! git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
    echo "Target branch '$TARGET_BRANCH' does not exist. Creating it..."
    git update-ref "refs/heads/$TARGET_BRANCH" "$FETCHED_HEAD_HASH"
    if [ $? -ne 0 ]; then
      echo "Error: Failed to create target branch '$TARGET_BRANCH'."
      exit 1
    fi
    echo "Branch '$TARGET_BRANCH' created successfully pointing to '$SOURCE_BRANCH' head."
else
    # Target branch exists, attempt merge (fast-forward or actual merge)
    echo "Target branch '$TARGET_BRANCH' exists. Attempting merge..."

    # For a bare repo, we can't directly 'checkout' and 'merge'.
    # Option 1: Try a fast-forward update (simplest, fails if not fast-forward)
    # git update-ref "refs/heads/$TARGET_BRANCH" "$FETCHED_HEAD_HASH" "$CURRENT_TARGET_HASH"
    # This requires knowing the current target hash and is complex to get right.

    # Option 2: Use 'git merge --ff-only' conceptually by checking ancestry.
    # Get the current commit hash of the target branch
    CURRENT_TARGET_HASH=$(git rev-parse "refs/heads/$TARGET_BRANCH")
    echo "Current target head commit hash: $CURRENT_TARGET_HASH"

    # Check if the target commit is an ancestor of the fetched commit (fast-forward possible)
    if git merge-base --is-ancestor "$CURRENT_TARGET_HASH" "$FETCHED_HEAD_HASH"; then
        echo "Fast-forward merge is possible. Updating '$TARGET_BRANCH'..."
        git update-ref "refs/heads/$TARGET_BRANCH" "$FETCHED_HEAD_HASH" "$CURRENT_TARGET_HASH"
        if [ $? -ne 0 ]; then
          echo "Error: Failed to update target branch '$TARGET_BRANCH' (fast-forward)."
          # Consider attempting a real merge here if needed in the future
          exit 1
        fi
        echo "Branch '$TARGET_BRANCH' successfully fast-forwarded."
    else
        # Non-fast-forward merge needed. This script currently doesn't handle this.
        # A real merge requires a working tree.
        echo "Error: Non-fast-forward merge required. This script only handles fast-forward merges or branch creation."
        echo "Manual merge needed in a non-bare clone or implement a temporary worktree strategy."
        exit 1 # Indicate failure for non-fast-forward
    fi
fi

echo "Merge operation completed for '$TARGET_BRANCH'."
# Cleanup is handled by trap

exit 0
