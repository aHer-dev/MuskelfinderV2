/* =========================================================================
   Download-Helfer — Blob-Export der Backup-Datei (DOM-Seiteneffekt).
   src/persistence/download.ts

   Bewusst dünn und von der reinen Adapter-Logik getrennt, damit `backup.ts`
   testbar bleibt. Der Dateiname folgt V1: `muskelfinder-backup-YYYY-MM-DD.json`.
   ========================================================================= */

import { serializeBackup } from './backup';
import type { BackupFile } from './types';

export function backupFilename(date: Date = new Date()): string {
  return `muskelfinder-backup-${date.toISOString().slice(0, 10)}.json`;
}

/** Löst den Datei-Download eines Backups aus. */
export function downloadBackup(backup: BackupFile, filename: string = backupFilename()): void {
  const blob = new Blob([serializeBackup(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
