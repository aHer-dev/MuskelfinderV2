import { Icon } from '../../ui/Icon';

/** Klinischer Bezug als hervorgehobene Box (Akzent-Tint + icInfo). */
export function ClinicalNote({ note }: { note: string }) {
  if (!note.trim()) return null;
  return (
    <aside className="clinical-note">
      <Icon name="icInfo" size={18} className="clinical-note__icon" />
      {/* Eigene Klasse, damit die Textspalte `min-width: 0` bekommt: Als Flex-Kind
          konnte sie sonst nicht unter ihre Inhaltsbreite schrumpfen und war bei 200 %
          Textzoom 310 px breit auf einem 320-px-Schirm. */}
      <div className="clinical-note__body">
        <p className="clinical-note__label">Klinischer Bezug</p>
        <p className="clinical-note__text">{note}</p>
      </div>
    </aside>
  );
}
