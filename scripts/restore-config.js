#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_SCRIPT = path.join(__dirname, 'config-backup.js');

console.log('🔧 Config Restore Tool');
console.log('─'.repeat(40));

// Run the backup script with list command to show available backups
const listProcess = spawn('node', [BACKUP_SCRIPT, 'list'], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

listProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n💡 To restore a backup, run:');
    console.log('   node scripts/restore-config.js <backup-number>');
    console.log('\n📝 Or use the backup script directly:');
    console.log('   node scripts/config-backup.js restore <backup-number>');
  }
});

// If a backup number is provided, restore it
const backupNumber = process.argv[2];
if (backupNumber) {
  const restoreProcess = spawn('node', [BACKUP_SCRIPT, 'restore', backupNumber], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  restoreProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n🎉 Restore completed! Your config.js has been restored.');
    } else {
      console.log('\n❌ Restore failed. Please check the backup number and try again.');
    }
  });
}
