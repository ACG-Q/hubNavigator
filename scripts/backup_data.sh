#!/bin/bash

# Configuration
BACKUP_BRANCH="backup"
DATA_DIR="data"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
BACKUP_MSG="chore: data backup ${TIMESTAMP} [skip ci]"

echo "Checking for data changes..."

# Ensure we are in a git repo
if [ ! -d ".git" ]; then
    echo "Error: Not a git repository."
    exit 1
fi

# Store the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create/Switch to backup branch
if git show-ref --verify --quiet refs/heads/${BACKUP_BRANCH}; then
    git checkout ${BACKUP_BRANCH}
else
    git checkout --orphan ${BACKUP_BRANCH}
    git rm -rf .
fi

# Restore data from current branch if it exists
git checkout ${CURRENT_BRANCH} -- ${DATA_DIR}

# Add and commit
git add ${DATA_DIR}
if git diff --cached --quiet; then
    echo "No changes in data to backup."
else
    git commit -m "${BACKUP_MSG}"
    echo "Pushing backup to ${BACKUP_BRANCH}..."
    git push origin ${BACKUP_BRANCH}
fi

# Switch back to original branch
git checkout ${CURRENT_BRANCH}
