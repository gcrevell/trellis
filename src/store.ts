import { create } from 'zustand';
import { HomeAssistant } from 'custom-card-helpers';
import { Config } from 'types';

interface Store {
  hass?: HomeAssistant;
  config?: Config;
}

export const store = create<Store>(() => ({}));
