import { describe, expect, it } from 'vitest';
import { createStore } from './store';
import { Config } from './types';

// Regression coverage for the bug where every card instance shared one
// module-level store, so the last card to call setConfig()/set hass() won and
// every other card on the dashboard rendered its config instead of its own.
describe('createStore', () => {
  it('gives each call its own independent state', () => {
    const a = createStore();
    const b = createStore();

    const configA: Config = { type: 'boilerplate-card-a' };
    const configB: Config = { type: 'boilerplate-card-b' };

    a.setState({ config: configA });
    b.setState({ config: configB });

    expect(a.getState().config?.type).toBe('boilerplate-card-a');
    expect(b.getState().config?.type).toBe('boilerplate-card-b');
  });

  it('does not leak state into stores created afterwards', () => {
    const a = createStore();
    a.setState({ config: { type: 'boilerplate-card-a' } });

    const b = createStore();

    expect(b.getState().config).toBeUndefined();
    expect(b.getState().hass).toBeUndefined();
  });
});
