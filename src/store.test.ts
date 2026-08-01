import { describe, expect, it } from 'vitest';
import { createStore } from './store';
import { BaseConfig } from './types';

interface TestConfig extends BaseConfig {
  name: string;
}

// Regression coverage for the bug where every card instance shared one
// module-level store, so the last card to call setConfig()/set hass() won and
// every other card on the dashboard rendered its config instead of its own.
describe('createStore', () => {
  it('gives each call its own independent state', () => {
    const a = createStore();
    const b = createStore();

    const configA: TestConfig = { type: 'test-card', name: 'Living Room' };
    const configB: TestConfig = { type: 'test-card', name: 'Kitchen' };

    a.setState({ config: configA });
    b.setState({ config: configB });

    expect((a.getState().config as TestConfig | undefined)?.name).toBe('Living Room');
    expect((b.getState().config as TestConfig | undefined)?.name).toBe('Kitchen');
  });

  it('does not leak state into stores created afterwards', () => {
    const a = createStore();
    a.setState({ config: { type: 'test-card', name: 'Living Room' } as TestConfig });

    const b = createStore();

    expect(b.getState().config).toBeUndefined();
    expect(b.getState().hass).toBeUndefined();
  });
});
