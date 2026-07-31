import { describe, expect, it } from 'vitest';
import { createStore } from './store';
import { Config } from './types';

// Regression coverage for the bug where every <room-card> instance shared one
// module-level store, so the last card to call setConfig()/set hass() won and
// every other card on the dashboard rendered its config instead of its own.
describe('createStore', () => {
  it('gives each call its own independent state', () => {
    const a = createStore();
    const b = createStore();

    const configA: Config = { type: 'room-card', name: 'Living Room', icon: 'mdi:sofa' };
    const configB: Config = { type: 'room-card', name: 'Kitchen', icon: 'mdi:silverware-fork-knife' };

    a.setState({ config: configA });
    b.setState({ config: configB });

    expect(a.getState().config?.name).toBe('Living Room');
    expect(b.getState().config?.name).toBe('Kitchen');
  });

  it('does not leak state into stores created afterwards', () => {
    const a = createStore();
    a.setState({ config: { type: 'room-card', name: 'Living Room', icon: 'mdi:sofa' } });

    const b = createStore();

    expect(b.getState().config).toBeUndefined();
    expect(b.getState().hass).toBeUndefined();
  });
});
