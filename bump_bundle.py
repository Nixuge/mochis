import os
import re
import sys

PROCESS_ANYWAYS = True

if len(sys.argv) != 2:
    print("Invalid arg count")
    exit(1)

matches = re.search(r"(src\/.*?\/)", sys.argv[1])
if not matches:
    print("Invalid file to bump")
    if PROCESS_ANYWAYS:
        os.system("bun run bundle")
    exit(2)

# Not sure if I should only use current file & check if is index (to make sure it doesn't overwrite anything)
# or keep it like this (=get current project & bump index.ts)
file_to_bump = matches.groups()[0] + "index.ts"
if not os.path.isfile(file_to_bump):
    print("Index does not exist")
    exit(3)

def increment_version(version_str):
    major, minor, patch = map(int, version_str.split('.'))
    patch += 1  # Increment the patch number
    return f"{major}.{minor}.{patch}"

def update_version_in_file(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    with open(file_path, 'w') as file:
        for line in lines:
            if line.strip().startswith('version:'):
                # Extract the current version string
                current_version = line.strip().split("'")[1]
                # Increment the version
                new_version = increment_version(current_version)
                # Replace the line with the new version
                line = f"    version: '{new_version}',\n"
            file.write(line)

# Hardcoded to use the module you're working on lol
update_version_in_file(file_to_bump)

os.system("bun run bundle")