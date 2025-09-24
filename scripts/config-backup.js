#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, '..', 'src', 'config.js');
const BACKUP_DIR = path.join(__dirname, '..', 'config-backups');
const BACKUP_INDEX_FILE = path.join(BACKUP_DIR, 'backup-index.json');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Load or create backup index
let backupIndex = [];
if (fs.existsSync(BACKUP_INDEX_FILE)) {
  try {
    backupIndex = JSON.parse(fs.readFileSync(BACKUP_INDEX_FILE, 'utf8'));
  } catch (error) {
    console.warn('Warning: Could not read backup index, starting fresh');
    backupIndex = [];
  }
}

function createBackup() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log('Config file does not exist, skipping backup');
    return;
  }

  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `config-${timestamp}.js`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  // Create backup
  fs.writeFileSync(backupFilePath, configContent);

  // Add to index
  const backupEntry = {
    timestamp: new Date().toISOString(),
    filename: backupFileName,
    size: configContent.length,
    hash: simpleHash(configContent)
  };

  backupIndex.push(backupEntry);

  // Keep only last 50 backups to prevent disk space issues
  if (backupIndex.length > 50) {
    const oldBackup = backupIndex.shift();
    const oldBackupPath = path.join(BACKUP_DIR, oldBackup.filename);
    if (fs.existsSync(oldBackupPath)) {
      fs.unlinkSync(oldBackupPath);
    }
  }

  // Save updated index
  fs.writeFileSync(BACKUP_INDEX_FILE, JSON.stringify(backupIndex, null, 2));

  console.log(`✅ Config backed up: ${backupFileName}`);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

function listBackups() {
  if (backupIndex.length === 0) {
    console.log('No backups found');
    return;
  }

  console.log('\n📋 Available backups:');
  console.log('─'.repeat(80));
  backupIndex.forEach((backup, index) => {
    const date = new Date(backup.timestamp).toLocaleString();
    console.log(`${index + 1}. ${backup.filename}`);
    console.log(`   Date: ${date}`);
    console.log(`   Size: ${backup.size} bytes`);
    console.log(`   Hash: ${backup.hash}`);
    console.log('');
  });
}

function restoreBackup(backupNumber) {
  const index = parseInt(backupNumber) - 1;
  
  if (index < 0 || index >= backupIndex.length) {
    console.error(`❌ Invalid backup number. Please choose between 1 and ${backupIndex.length}`);
    return;
  }

  const backup = backupIndex[index];
  const backupFilePath = path.join(BACKUP_DIR, backup.filename);

  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Backup file not found: ${backup.filename}`);
    return;
  }

  // Create a backup of current config before restoring
  createBackup();

  // Restore the backup
  const backupContent = fs.readFileSync(backupFilePath, 'utf8');
  fs.writeFileSync(CONFIG_PATH, backupContent);

  console.log(`✅ Restored backup: ${backup.filename}`);
  console.log(`   Date: ${new Date(backup.timestamp).toLocaleString()}`);
}

function watchConfigFile() {
  console.log('👀 Watching config.js for changes...');
  
  // Create initial backup
  createBackup();

  // Watch for file changes
  fs.watchFile(CONFIG_PATH, { interval: 1000 }, (curr, prev) => {
    if (curr.mtime > prev.mtime) {
      console.log('📝 Config file changed, creating backup...');
      createBackup();
    }
  });

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping config watcher...');
    fs.unwatchFile(CONFIG_PATH);
    process.exit(0);
  });
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'backup':
    createBackup();
    break;
  case 'list':
    listBackups();
    break;
  case 'restore':
    const backupNumber = process.argv[3];
    if (!backupNumber) {
      console.error('❌ Please provide a backup number to restore');
      console.log('Usage: node config-backup.js restore <backup-number>');
      process.exit(1);
    }
    restoreBackup(backupNumber);
    break;
  case 'watch':
    watchConfigFile();
    break;
  default:
    console.log('Config Backup System');
    console.log('Usage:');
    console.log('  node config-backup.js backup    - Create a backup now');
    console.log('  node config-backup.js list      - List all backups');
    console.log('  node config-backup.js restore N - Restore backup number N');
    console.log('  node config-backup.js watch     - Watch for changes and auto-backup');
    break;
}
