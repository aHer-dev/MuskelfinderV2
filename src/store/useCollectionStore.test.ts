import { beforeEach, describe, expect, it } from 'vitest';
import { useCollectionStore } from './useCollectionStore';

function reset() {
  localStorage.clear();
  useCollectionStore.getState().clear();
}

describe('useCollectionStore — Merkliste', () => {
  beforeEach(reset);

  it('add fügt hinzu, Duplikate bleiben aus', () => {
    const s = useCollectionStore.getState();
    s.add('deltoideus');
    s.add('deltoideus');
    expect(useCollectionStore.getState().muscleIds).toEqual(['deltoideus']);
    expect(useCollectionStore.getState().has('deltoideus')).toBe(true);
  });

  it('toggle schaltet die Zugehörigkeit um und meldet den neuen Zustand', () => {
    const s = useCollectionStore.getState();
    expect(s.toggle('biceps-brachii')).toBe(true);
    expect(useCollectionStore.getState().has('biceps-brachii')).toBe(true);
    expect(useCollectionStore.getState().toggle('biceps-brachii')).toBe(false);
    expect(useCollectionStore.getState().has('biceps-brachii')).toBe(false);
  });

  it('remove und clear leeren die Liste', () => {
    const s = useCollectionStore.getState();
    s.add('a');
    s.add('b');
    s.remove('a');
    expect(useCollectionStore.getState().muscleIds).toEqual(['b']);
    useCollectionStore.getState().clear();
    expect(useCollectionStore.getState().muscleIds).toEqual([]);
  });

  it('persistiert unter dem Key mf.collection', () => {
    useCollectionStore.getState().add('deltoideus');
    const raw = localStorage.getItem('mf.collection');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).state.muscleIds).toEqual(['deltoideus']);
  });
});
