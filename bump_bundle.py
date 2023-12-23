import os

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
update_version_in_file("src/flixhq/index.ts")

os.system("bun run bundle")