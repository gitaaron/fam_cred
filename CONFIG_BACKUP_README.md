# Config Backup System

This system automatically backs up your `src/config.js` file to prevent data loss since it's in `.gitignore`.

## How It Works

- **Automatic Backup**: Every time you run `npm run dev`, a backup is created before starting the dev server
- **File Watching**: Use `npm run dev:watch` to automatically backup whenever `config.js` changes
- **Version History**: Keeps up to 50 backups with timestamps and file hashes
- **Easy Restore**: Simple commands to list and restore previous versions

## Usage

### Development Commands

```bash
# Standard dev with backup before starting
npm run dev

# Dev with automatic backup on file changes (recommended)
npm run dev:watch
```

### Manual Backup Commands

```bash
# Create a backup now
npm run config:backup

# List all available backups
npm run config:list

# Restore a specific backup (shows list first)
npm run config:restore

# Watch for changes and auto-backup
npm run config:watch
```

### Direct Script Usage

```bash
# Create backup
node scripts/config-backup.js backup

# List backups
node scripts/config-backup.js list

# Restore backup #3
node scripts/config-backup.js restore 3

# Watch for changes
node scripts/config-backup.js watch
```

## File Structure

```
config-backups/
├── backup-index.json          # Index of all backups
├── config-2024-01-15T10-30-45-123Z.js
├── config-2024-01-15T11-15-22-456Z.js
└── ...
```

## Features

- ✅ **Non-blocking**: Backups don't interfere with your development workflow
- ✅ **Automatic**: Runs seamlessly with `npm run dev`
- ✅ **Version History**: Keeps detailed history with timestamps and file hashes
- ✅ **Space Management**: Automatically keeps only the last 50 backups
- ✅ **Easy Restore**: Simple commands to revert to any previous version
- ✅ **Safe Restore**: Creates a backup before restoring (so you can undo the restore)

## Example Workflow

1. **Start development with auto-backup**:
   ```bash
   npm run dev:watch
   ```

2. **Make changes to `src/config.js`** - backups are created automatically

3. **List available backups**:
   ```bash
   npm run config:list
   ```

4. **Restore a previous version**:
   ```bash
   npm run config:restore 5
   ```

## Troubleshooting

- If you see permission errors, make sure the scripts are executable:
  ```bash
  chmod +x scripts/config-backup.js scripts/restore-config.js
  ```

- The backup directory is created automatically in your project root
- Backups are stored in `config-backups/` directory
- The system keeps the last 50 backups to prevent disk space issues
