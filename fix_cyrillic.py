#!/usr/bin/env python3

"""
Script to fix Cyrillic characters in parentheses by normalizing them to Latin equivalents
Example: (6а) → (6a), (7а) → (7a)
"""

import json
import re
import sys
import os
from pathlib import Path

# Mapping of Cyrillic characters to their Latin lookalikes
CYRILLIC_TO_LATIN = {
    # Lowercase
    'а': 'a',  # Cyrillic a → Latin a
    'е': 'e',  # Cyrillic e → Latin e
    'і': 'i',  # Cyrillic i → Latin i
    'о': 'o',  # Cyrillic o → Latin o
    'р': 'p',  # Cyrillic r → Latin p
    'с': 'c',  # Cyrillic s → Latin c
    'у': 'y',  # Cyrillic u → Latin y
    'х': 'x',  # Cyrillic kh → Latin x
    'ѕ': 's',  # Cyrillic dze → Latin s
    
    # Uppercase
    'А': 'A',  # Cyrillic A → Latin A
    'В': 'B',  # Cyrillic V → Latin B
    'Е': 'E',  # Cyrillic E → Latin E
    'І': 'I',  # Cyrillic I → Latin I
    'К': 'K',  # Cyrillic K → Latin K
    'М': 'M',  # Cyrillic M → Latin M
    'Н': 'H',  # Cyrillic N → Latin H
    'О': 'O',  # Cyrillic O → Latin O
    'Р': 'P',  # Cyrillic R → Latin P
    'С': 'C',  # Cyrillic S → Latin C
    'Т': 'T',  # Cyrillic T → Latin T
    'Х': 'X',  # Cyrillic Kh → Latin X
    'Ѕ': 'S',  # Cyrillic DZE → Latin S
}

# Pattern to match content in parentheses
PARENTHESES_PATTERN = re.compile(r'\([^)]+\)')


def has_cyrillic(text):
    """Check if a string contains any Cyrillic characters"""
    return any(char in text for char in CYRILLIC_TO_LATIN.keys())


def cyrillic_to_latin(text):
    """Convert Cyrillic characters to Latin equivalents"""
    result = text
    for cyrillic, latin in CYRILLIC_TO_LATIN.items():
        result = result.replace(cyrillic, latin)
    return result


def fix_cyrillic_in_parentheses(content):
    """Process content and fix Cyrillic in parentheses"""
    changes = []
    
    def replacer(match):
        original = match.group(0)
        if has_cyrillic(original):
            fixed = cyrillic_to_latin(original)
            changes.append({'original': original, 'fixed': fixed})
            return fixed
        return original
    
    result = PARENTHESES_PATTERN.sub(replacer, content)
    return result, len(changes), changes


def process_json_file(file_path, dry_run=False):
    """Process a JSON file"""
    print(f"\nProcessing: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        result, changes_count, changes = fix_cyrillic_in_parentheses(content)
        
        if changes_count > 0:
            print(f"  ✓ Found {changes_count} issue(s)")
            for i, change in enumerate(changes, 1):
                print(f"    {i}. {change['original']} → {change['fixed']}")
            
            if not dry_run:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(result)
                print(f"  ✓ Fixed and saved")
            else:
                print(f"  ℹ Dry run - no changes made")
        else:
            print(f"  ✓ No issues found")
        
        return changes_count
    except Exception as e:
        print(f"  ✗ Error processing file: {e}")
        return 0


def process_directory(dir_path, dry_run=False):
    """Process all JSON files in a directory"""
    print(f"\nScanning directory: {dir_path}")
    
    total_changes = 0
    path = Path(dir_path)
    
    for json_file in path.glob('*.json'):
        total_changes += process_json_file(json_file, dry_run)
    
    return total_changes


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Fix Cyrillic characters in parentheses by normalizing them to Latin equivalents',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python fix_cyrillic.py                           # Fix all files in public/texts and docs/texts
  python fix_cyrillic.py --dry-run                 # Preview changes without applying them
  python fix_cyrillic.py public/texts/fr.json      # Fix a specific file
  python fix_cyrillic.py public/texts              # Fix all files in a directory
        '''
    )
    
    parser.add_argument('path', nargs='?', help='Path to file or directory to process')
    parser.add_argument('-d', '--dry-run', action='store_true', 
                       help='Show what would be changed without making changes')
    
    args = parser.parse_args()
    
    print('🔍 Cyrillic to Latin Normalizer')
    print('================================')
    
    if args.dry_run:
        print('⚠️  DRY RUN MODE - No changes will be made\n')
    
    total_changes = 0
    
    if args.path:
        # Process specific file or directory
        path = Path(args.path)
        if path.is_dir():
            total_changes = process_directory(path, args.dry_run)
        elif path.is_file() and path.suffix == '.json':
            total_changes = process_json_file(path, args.dry_run)
        else:
            print('Error: Please provide a JSON file or directory')
            sys.exit(1)
    else:
        # Process default directories
        directories = ['public/texts', 'docs/texts']
        
        for directory in directories:
            if os.path.exists(directory):
                total_changes += process_directory(directory, args.dry_run)
    
    print('\n================================')
    print(f'✨ Complete! Total changes: {total_changes}')
    
    if args.dry_run and total_changes > 0:
        print('\n💡 Run without --dry-run to apply the changes')


if __name__ == '__main__':
    main()
