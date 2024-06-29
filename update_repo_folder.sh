#!/bin/bash

# Ensure the script stops on any error
set -e


# Switch to the main branch and pull the latest changes
git fetch upstream
git checkout main
git pull upstream main --rebase


# Copy the repo/ directory to a temporary location
cp -r repo/ /tmp/repo_backup

# Switch to the monitor branch
git checkout monitor

# Replace the repo/ directory in the monitor branch with the one from the main branch
rm -rf repo/
mv /tmp/repo_backup repo/

# Stage and commit the changes
git add repo/

# Clean up the temporary backup directory
rm -rf /tmp/repo_backup
