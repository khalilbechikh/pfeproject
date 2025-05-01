#!/bin/bash

prepare_pull_request_merge() {
    local maintainer_bare_repo_path="$1"
    local temp_working_path="$2"
    local contributor_repo_path="$3"
    local source_branch="$4"
    local target_branch="$5"

    local LOGFILE="/home/jobran/Desktop/testgit/logs.txt"

    echo "🛠 Starting prepare_pull_request_merge..." >> "$LOGFILE"

    mkdir -p "$temp_working_path"
    git clone "$maintainer_bare_repo_path" "$temp_working_path" >> "$LOGFILE" 2>&1

    cd "$temp_working_path" || exit 1

    echo "📂 Working Directory: $(pwd)" >> "$LOGFILE"

    git checkout "$target_branch" >> "$LOGFILE" 2>&1

    if ! git remote | grep -q "contributor"; then
        git remote add contributor "../../../$contributor_repo_path"
    fi

    git fetch contributor "$source_branch:$source_branch" >> "$LOGFILE" 2>&1

    echo "🔍 Branches before merge:" >> "$LOGFILE"
    git branch -a >> "$LOGFILE"

    set +e
    git merge --no-commit --no-ff "$source_branch" >> "$LOGFILE" 2>&1
    local merge_result=$?
    set -e

    echo "📄 app.js content after merge attempt:" >> "$LOGFILE"
    if [ -f "app.js" ]; then
        cat app.js >> "$LOGFILE"
    else
        echo "(no app.js file found)" >> "$LOGFILE"
    fi

    if [ $merge_result -ne 0 ]; then
        echo "⚡ Merge performed but conflicts exist. Please resolve manually." >> "$LOGFILE"
    else
        echo "✅ Merge successful with no conflicts." >> "$LOGFILE"
    fi
}
