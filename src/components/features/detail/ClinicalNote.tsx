import { Icon } from '../../ui/Icon';

/** Klinischer Bezug als hervorgehobene Box (Akzent-Tint + icInfo). */
export function ClinicalNote({ note }: { note: string }) {
  if (!note.trim()) return null;
  return (
    <aside className="clinical-note">
      <Icon name="icInfo" size={18} className="clinical-note__icon" />
      <div>
        <p className="clinical-note__label">Klinischer Bezug</p>
        <p className="clinical-note__text">{note}</p>
      </div>
    </aside>
  );
}
