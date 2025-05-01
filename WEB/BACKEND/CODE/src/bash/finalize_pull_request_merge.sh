#!/bin/bash

finalize_pull_request_merge() {
    local repo_path="$1"

    local LOGFILE="/home/jobran/Desktop/testgit/logs.txt"

    echo "🔒 Starting finalize_pull_request_merge..." >> "$LOGFILE"

    cd "$repo_path" || exit 1

    echo "📂 Working Directory: $(pwd)" >> "$LOGFILE"

    if git status --porcelain | grep -q "^UU"; then
        echo "❌ Pull Request not merged yet: Conflicts still exist." >> "$LOGFILE"
        return 1
    fi

    git add . >> "$LOGFILE" 2>&1
    git commit -m "Merge Pull Request: Conflict resolved." >> "$LOGFILE" 2>&1

    echo "📄 Final app.js content after merge:" >> "$LOGFILE"
    if [ -f "app.js" ]; then
        cat app.js >> "$LOGFILE"
    else
        echo "(no app.js file found)" >> "$LOGFILE"
    fi

    echo "✅ Pull Request merged successfully." >> "$LOGFILE"
    return 0
}
