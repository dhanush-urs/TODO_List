#!/bin/bash

################################################################################
# Script: delete_md_files.sh
# Description: Safely delete all .md files except README.md
# Usage: ./delete_md_files.sh [OPTIONS]
# Options:
#   --dry-run    Preview files without deleting
#   --yes        Skip confirmation prompt
#   --help       Show help message
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default settings
DRY_RUN=false
SKIP_CONFIRMATION=false
CASE_INSENSITIVE=true

# Counters
TOTAL_FOUND=0
TOTAL_DELETED=0
TOTAL_SKIPPED=0

# Arrays to store files
declare -a FILES_TO_DELETE
declare -a FILES_TO_SKIP

################################################################################
# Functions
################################################################################

# Print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Print header
print_header() {
    echo ""
    print_color "$BLUE" "═══════════════════════════════════════════════════════════"
    print_color "$BLUE" "  Markdown File Cleanup Script"
    print_color "$BLUE" "═══════════════════════════════════════════════════════════"
    echo ""
}

# Print help message
print_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Delete all .md files in the current directory and subdirectories,
except README.md (case-insensitive).

OPTIONS:
    --dry-run           Preview files without deleting (safe mode)
    --yes               Skip confirmation prompt (auto-confirm)
    --case-sensitive    Make README.md matching case-sensitive
    --help              Show this help message

EXAMPLES:
    $0                  # Interactive mode with preview
    $0 --dry-run        # Preview only, no deletion
    $0 --yes            # Delete without confirmation
    $0 --case-sensitive # Only protect exact "README.md"

SAFETY FEATURES:
    ✓ Preview files before deletion
    ✓ Confirmation prompt (unless --yes)
    ✓ Protects README.md (case-insensitive by default)
    ✓ Only deletes .md files
    ✓ Handles spaces in filenames
    ✓ Recursive search in all subdirectories

EOF
    exit 0
}

# Check if filename is README.md (case-insensitive or sensitive)
is_readme() {
    local filename=$(basename "$1")
    
    if [ "$CASE_INSENSITIVE" = true ]; then
        # Case-insensitive comparison (convert to lowercase)
        local filename_lower=$(echo "$filename" | tr '[:upper:]' '[:lower:]')
        if [[ "$filename_lower" == "readme.md" ]]; then
            return 0  # true
        fi
    else
        # Case-sensitive comparison
        if [[ "$filename" == "README.md" ]]; then
            return 0  # true
        fi
    fi
    
    return 1  # false
}

# Find all markdown files
find_markdown_files() {
    print_color "$YELLOW" "🔍 Searching for Markdown files..."
    echo ""
    
    # Find all .md files recursively
    while IFS= read -r -d '' file; do
        TOTAL_FOUND=$((TOTAL_FOUND + 1))
        
        if is_readme "$file"; then
            FILES_TO_SKIP+=("$file")
            TOTAL_SKIPPED=$((TOTAL_SKIPPED + 1))
        else
            FILES_TO_DELETE+=("$file")
        fi
    done < <(find . -type f -name "*.md" -print0)
}

# Display files to be deleted
display_preview() {
    echo ""
    print_color "$BLUE" "═══════════════════════════════════════════════════════════"
    print_color "$BLUE" "  PREVIEW: Files Found"
    print_color "$BLUE" "═══════════════════════════════════════════════════════════"
    echo ""
    
    # Show files to be skipped (protected)
    if [ ${#FILES_TO_SKIP[@]} -gt 0 ]; then
        print_color "$GREEN" "✓ Protected files (will NOT be deleted):"
        for file in "${FILES_TO_SKIP[@]}"; do
            echo "  → $file"
        done
        echo ""
    fi
    
    # Show files to be deleted
    if [ ${#FILES_TO_DELETE[@]} -gt 0 ]; then
        if [ "$DRY_RUN" = true ]; then
            print_color "$YELLOW" "⚠ Files that WOULD be deleted:"
        else
            print_color "$RED" "✗ Files to be DELETED:"
        fi
        for file in "${FILES_TO_DELETE[@]}"; do
            echo "  → $file"
        done
        echo ""
    else
        print_color "$GREEN" "✓ No files to delete!"
        echo ""
    fi
}

# Display summary
display_summary() {
    echo ""
    print_color "$BLUE" "═══════════════════════════════════════════════════════════"
    print_color "$BLUE" "  Summary"
    print_color "$BLUE" "═══════════════════════════════════════════════════════════"
    echo ""
    echo "  Total .md files found:    $TOTAL_FOUND"
    echo "  Files protected:          $TOTAL_SKIPPED"
    echo "  Files to delete:          ${#FILES_TO_DELETE[@]}"
    
    if [ "$DRY_RUN" = false ] && [ $TOTAL_DELETED -gt 0 ]; then
        echo ""
        print_color "$GREEN" "  ✓ Files deleted:          $TOTAL_DELETED"
    fi
    echo ""
}

# Ask for confirmation
ask_confirmation() {
    if [ "$SKIP_CONFIRMATION" = true ]; then
        return 0
    fi
    
    echo ""
    print_color "$YELLOW" "⚠ WARNING: This will permanently delete ${#FILES_TO_DELETE[@]} file(s)!"
    echo ""
    read -p "Do you want to proceed? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_color "$YELLOW" "✗ Operation cancelled by user."
        exit 0
    fi
}

# Delete files
delete_files() {
    if [ ${#FILES_TO_DELETE[@]} -eq 0 ]; then
        print_color "$GREEN" "✓ No files to delete. Nothing to do!"
        return
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_color "$YELLOW" "🔍 DRY RUN MODE: No files were actually deleted."
        return
    fi
    
    echo ""
    print_color "$YELLOW" "🗑️  Deleting files..."
    echo ""
    
    for file in "${FILES_TO_DELETE[@]}"; do
        if [ -f "$file" ]; then
            if rm "$file" 2>/dev/null; then
                print_color "$GREEN" "  ✓ Deleted: $file"
                TOTAL_DELETED=$((TOTAL_DELETED + 1))
            else
                print_color "$RED" "  ✗ Failed to delete: $file"
            fi
        else
            print_color "$YELLOW" "  ⚠ File not found: $file"
        fi
    done
}

# Validate we're in a safe directory
validate_directory() {
    # Check if we're in root directory (dangerous!)
    if [ "$PWD" = "/" ]; then
        print_color "$RED" "✗ ERROR: Cannot run this script in root directory!"
        exit 1
    fi
    
    # Check if directory is readable
    if [ ! -r "$PWD" ]; then
        print_color "$RED" "✗ ERROR: Cannot read current directory!"
        exit 1
    fi
}

################################################################################
# Main Script
################################################################################

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --yes)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --case-sensitive)
            CASE_INSENSITIVE=false
            shift
            ;;
        --help|-h)
            print_help
            ;;
        *)
            print_color "$RED" "✗ Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Main execution
main() {
    # Print header
    print_header
    
    # Show current directory
    print_color "$BLUE" "📁 Working directory: $PWD"
    echo ""
    
    # Show mode
    if [ "$DRY_RUN" = true ]; then
        print_color "$YELLOW" "🔍 Mode: DRY RUN (preview only, no deletion)"
    else
        print_color "$YELLOW" "⚠️  Mode: DELETE (files will be permanently deleted)"
    fi
    
    if [ "$CASE_INSENSITIVE" = true ]; then
        echo "🔒 Protection: README.md (case-insensitive)"
    else
        echo "🔒 Protection: README.md (case-sensitive)"
    fi
    
    echo ""
    
    # Validate directory
    validate_directory
    
    # Find markdown files
    find_markdown_files
    
    # Display preview
    display_preview
    
    # Display summary
    display_summary
    
    # Exit if no files to delete
    if [ ${#FILES_TO_DELETE[@]} -eq 0 ]; then
        exit 0
    fi
    
    # Ask for confirmation (unless dry-run or --yes)
    if [ "$DRY_RUN" = false ]; then
        ask_confirmation
        
        # Delete files
        delete_files
        
        # Display final summary
        echo ""
        print_color "$BLUE" "═══════════════════════════════════════════════════════════"
        print_color "$GREEN" "✓ Operation completed successfully!"
        print_color "$BLUE" "═══════════════════════════════════════════════════════════"
        echo ""
        echo "  Files deleted: $TOTAL_DELETED"
        echo "  Files protected: $TOTAL_SKIPPED"
        echo ""
    fi
}

# Run main function
main

exit 0
