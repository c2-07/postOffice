#!/bin/bash

FILES=()
while IFS= read -r line; do
    FILES+=("$line")
done < <(git status --porcelain | sed -E 's/^.{2} //g')

TOTAL=${#FILES[@]}

if [ "$TOTAL" -eq 0 ]; then
    echo "No files to commit."
    exit 0
fi

START_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "2026-07-20 10:00:00" "+%s")
END_TS=$(date -j -f "%Y-%m-%d %H:%M:%S" "2026-07-31 18:00:00" "+%s")

if [ "$TOTAL" -gt 1 ]; then
    STEP=$(( (END_TS - START_TS) / (TOTAL - 1) ))
else
    STEP=0
fi

CURRENT_TS=$START_TS

for FILE in "${FILES[@]}"; do
    git add "$FILE"
    
    COMMIT_DATE=$(date -j -r "$CURRENT_TS" "+%Y-%m-%dT%H:%M:%S+05:30")
    
    MSG="Update ${FILE}"
    echo "Committing $FILE at $COMMIT_DATE"
    
    GIT_AUTHOR_DATE="$COMMIT_DATE" GIT_COMMITTER_DATE="$COMMIT_DATE" git commit -m "$MSG"
    
    CURRENT_TS=$((CURRENT_TS + STEP))
done
