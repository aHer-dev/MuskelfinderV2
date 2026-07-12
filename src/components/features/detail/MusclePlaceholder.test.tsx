import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MusclePlaceholder } from './MusclePlaceholder';
import { getMuscles } from '../../../data';
import { createRng, generateQuiz } from '../../../data/quiz';
import type { QuizMode } from '../../../types';

const MUSCLES = getMuscles();
const OHNE_BILD = MUSCLES.filter((m) => m.images.length === 0);

describe('MusclePlaceholder', () => {
  it('setzt Name, Region und Subregion — die Lücke sieht absichtlich aus', () => {
    const muscle = OHNE_BILD[0];
    render(<MusclePlaceholder muscle={muscle} />);

    expect(screen.getByText(muscle.nameLatin)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(muscle.subregion))).toBeInTheDocument();
  });

  it('ist ehrlich beschriftet — keine Attrappe eines kaputten Bildes', () => {
    render(<MusclePlaceholder muscle={OHNE_BILD[0]} />);

    expect(
      screen.getByText('Für diesen Muskel liegt kein lizenzfreies Bild vor.'),
    ).toBeInTheDocument();
  });

  it('bringt kein <img> mit — ein Platzhalter ist kein Bild', () => {
    const { container } = render(<MusclePlaceholder muscle={OHNE_BILD[0]} />);
    expect(container.querySelector('img')).toBeNull();
  });
});

/* Die harte Grenze aus dem Briefing: Ein Platzhalter darf NIE in den Bildquiz-Pool. */
describe('Bildquiz-Modi sehen die Platzhalter-Muskeln nicht', () => {
  const IMAGE_MODES: QuizMode[] = ['image', 'name-image', 'image-mixed'];

  it('47 von 150 Muskeln haben kein Bild — der Datenstand, um den es geht', () => {
    expect(MUSCLES).toHaveLength(150);
    expect(OHNE_BILD).toHaveLength(47);
  });

  it.each(IMAGE_MODES)('„%s" fragt keinen Muskel ohne echtes Bild ab', (mode) => {
    const ohneBild = new Set(OHNE_BILD.map((m) => m.nameLatin));

    // Grosszuegig ziehen: Wer hier durchrutscht, faellt auf.
    const quiz = generateQuiz(MUSCLES, mode, 150, createRng(4711));
    expect(quiz.length).toBeGreaterThan(0);

    for (const question of quiz) {
      const asked = MUSCLES.find((m) => m.id === question.muscleId);
      expect(asked, 'Frage ohne zuordenbaren Muskel').toBeDefined();
      expect(ohneBild.has(asked!.nameLatin), `${asked!.nameLatin} hat kein Bild`).toBe(false);
    }
  });
});
