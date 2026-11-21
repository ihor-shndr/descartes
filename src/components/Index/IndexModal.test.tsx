import assert from 'node:assert/strict';
import { test } from 'node:test';
import { useAppStore } from '../../store/app-store';
import { INDEX_GRAPH_VERSION, IndexLanguage } from '../../types/termIndex';

test('records index loading failures and permits a retry', async context => {
  const previous = useAppStore.getState();
  const persistence = useAppStore.persist?.getOptions();
  useAppStore.persist?.setOptions({
    storage: { getItem: () => null, setItem: () => undefined, removeItem: () => undefined },
  });
  let available = false;
  context.mock.method(globalThis, 'fetch', async () => available
    ? new Response(JSON.stringify({
      version: INDEX_GRAPH_VERSION,
      languages: [IndexLanguage.Latin, IndexLanguage.French],
      sources: [],
      nodes: [],
      edges: [],
      notes: { [IndexLanguage.Latin]: [], [IndexLanguage.French]: [] },
    }))
    : new Response(null, { status: 503, statusText: 'Service Unavailable' }));

  try {
    useAppStore.setState({ indexModalOpen: true, indexData: null, indexLoading: false, indexError: null });
    await useAppStore.getState().loadIndexData();
    assert.match(useAppStore.getState().indexError ?? '', /Service Unavailable/);
    assert.equal(useAppStore.getState().indexLoading, false);

    available = true;
    await useAppStore.getState().loadIndexData();
    assert.equal(useAppStore.getState().indexError, null);
    assert.ok(useAppStore.getState().indexData);
  } finally {
    useAppStore.setState(previous, true);
    if (persistence?.storage) useAppStore.persist?.setOptions({ storage: persistence.storage });
  }
});
