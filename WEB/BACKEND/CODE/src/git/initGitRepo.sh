#!/bin/bash

BASE_DIR="/srv/git"  # Base directory where repositories will be stored

init_git_repo() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "Usage: init_git_repo <repo_name> <username>"
        return 1
    fi

    REPO_NAME="$1"
    USERNAME="$2"
    USER_DIR="$BASE_DIR/$USERNAME"
    REPO_PATH="$USER_DIR/$REPO_NAME.git"

    # Create user directory if it doesn't exist
    mkdir -p "$USER_DIR"

    # Create the bare Git repository
    git init --bare "$REPO_PATH"

    # Configure safe directory to facilitate remote operations
    git config --global safe.directory "$REPO_PATH"

    # Set proper permissions (optional)
    chmod -R 775 "$REPO_PATH"

    echo "Bare Git repository '$REPO_NAME' initialized for user '$USERNAME' at: $REPO_PATH"
    echo "Safe directory configured for easier remote access."
}

# Call the function with the repository name and username
init_git_repo "$1" "$2"
