#!/bin/bash

preview_pull_request_with_conflict_info() {
    local maintainer_repo_path="$1"
    local contributor_repo_path="$2"
    local source_branch="$3"
    local target_branch="$4"

    local LOGFILE="/home/jobran/Desktop/testgit/logs.txt"

    echo "🔍 Starting preview_pull_request_with_conflict_info..." >> "$LOGFILE"

    cd "$maintainer_repo_path" || exit 1

    if ! git remote | grep -q "contributor"; then
        git remote add contributor "../../$contributor_repo_path"
    fi

    git fetch contributor "$source_branch:$source_branch" >> "$LOGFILE" 2>&1

    echo "🔍 Checking existence of branches..." >> "$LOGFILE"

    if ! git show-ref --verify --quiet "refs/heads/$target_branch"; then
        echo "❌ Error: Target branch '$target_branch' does not exist!" >> "$LOGFILE"
        exit 1
    fi

    if ! git show-ref --verify --quiet "refs/heads/$source_branch"; then
        echo "❌ Error: Source branch '$source_branch' does not exist!" >> "$LOGFILE"
        exit 1
    fi

    echo "✅ Both branches exist." >> "$LOGFILE"

    local conflict=false
    if git merge-tree "$(git merge-base $target_branch $source_branch)" "$target_branch" "$source_branch" | grep -q "^<<<<<<<"; then
        conflict=true
    fi

    echo "{"
    echo "  \"conflict\": $conflict,"
    echo "  \"changes\": ["

    local changes
    changes=$(git diff --name-status "$target_branch" "$source_branch")

    echo "🔍 Listing file changes:" >> "$LOGFILE"
    echo "$changes" >> "$LOGFILE"

    local first=1

    while IFS=$'\t' read -r status filename; do
        if [ -z "$filename" ]; then
            continue
        fi

        local datetime
        datetime=$(git log -1 --format="%cI" "$source_branch" -- "$filename")

        if [ "$first" -eq 0 ]; then
            echo ","
        fi
        first=0

        case "$status" in
            A)
                jo file="$filename" status="added" diff="null" datetime="$datetime"
                ;;
            D)
                jo file="$filename" status="deleted" diff="null" datetime="$datetime"
                ;;
            M)
                local diff_content
                diff_content=$(git diff "$target_branch" "$source_branch" -- "$filename" | sed "s/\\\\/\\\\\\\\/g" | sed "s/\"/\\\\\"/g" | sed ":a;N;\$!ba;s/\n/\\\\n/g")
                jo file="$filename" status="modified" diff="$diff_content" datetime="$datetime"
                ;;
        esac
    done <<< "$changes"

    echo
    echo "  ]"
    echo "}"

    cd ../../
}
