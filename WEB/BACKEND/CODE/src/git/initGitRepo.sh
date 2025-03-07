#!/bin/bash

BASE_DIR="/srv/git"  # Base directory where repositories will be stored

init_git_repo() {
    if [ -z "$1" ]; then
        echo "Usage: init_git_repo <repo_name>"
        return 1
    fi

    REPO_NAME="$1"
    REPO_PATH="$BASE_DIR/$REPO_NAME.git"

    # Create the bare Git repository
    git init --bare "$REPO_PATH"

    # Configure safe directory to facilitate remote operations
    git config --global safe.directory "$REPO_PATH"

    # Set proper permissions (optional)
     chmod -R 775 "$REPO_PATH"

    echo "Bare Git repository '$REPO_NAME' initialized at: $REPO_PATH"
    echo "Safe directory configured for easier remote access."
}

# Call the function with the repository name
init_git_repo "$1"
