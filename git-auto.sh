#!/bin/bash

echo "Git Automation Script"
echo "-------------------"

# Tampilkan status git
echo "Current git status:"
git status

# Input file yang akan di-add
echo -e "\nEnter files to add (separate with space):"
read -e files

# Add files
if [ ! -z "$files" ]; then
    echo -e "\nAdding files: $files"
    git add $files
else
    echo "No files specified"
    exit 1
fi

# Input commit message
echo -e "\nEnter commit message:"
read -e commit_msg

# Jika commit message kosong, gunakan timestamp
if [ -z "$commit_msg" ]; then
    commit_msg="Update $(date +'%Y-%m-%d %H:%M')"
fi

# Commit changes
echo -e "\nCommitting with message: $commit_msg"
git commit -m "$commit_msg"

# Get current branch
branch=$(git rev-parse --abbrev-ref HEAD)

# Konfirmasi push
echo -e "\nPush to $branch? (y/n)"
read -e confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    echo "Pushing to $branch..."
    git push origin $branch
    echo "Done!"
else
    echo "Push cancelled"
fi 