import { useRef, useState } from 'react';
import { exportBackup, importBackup } from '../../../persistence/backup-service';
import { downloadBackup } from '../../../persistence/download';

type Message = { kind: 'ok' | 'err'; text: string };

/**
 * Backup-Verwaltung — bindet den Etappe-2-Kompatibilitätskern an die UI:
 * Export lädt eine v2-Datei herunter, Import akzeptiert v1/v2/Legacy und lehnt
 * fehlerhafte/zu neue Dateien mit klarer Meldung ab.
 */
export function BackupPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const handleExport = () => {
    downloadBackup(exportBackup());
    setMessage({ kind: 'ok', text: 'Backup wurde heruntergeladen.' });
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const result = importBackup(await file.text());
      const label = result.type === 'legacy-flashcards' ? 'Lernkarten' : 'Voll-Backup';
      setMessage({ kind: 'ok', text: `Import erfolgreich (${label}).` });
    } catch (error) {
      setMessage({
        kind: 'err',
        text: error instanceof Error ? error.message : 'Import fehlgeschlagen.',
      });
    }
  };

  return (
    <section className="stats__panel">
      <h2>Datensicherung</h2>
      <p className="stats__quiz-line">
        Fortschritt sichern oder ein bestehendes Backup (auch aus V1) importieren.
      </p>
      <div className="backup-panel__actions">
        <button type="button" className="btn btn--primary" onClick={handleExport}>
          Exportieren
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
          Importieren
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="backup-panel__input"
          onChange={handleFile}
        />
      </div>
      {message && (
        <p
          className={`backup-panel__msg backup-panel__msg--${message.kind}`}
          role="status"
          aria-live="polite"
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
