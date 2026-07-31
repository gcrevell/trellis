import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { create, StoreApi, UseBoundStore } from 'zustand';
import { HomeAssistant } from 'custom-card-helpers';
import { Config } from 'types';

interface Store {
  hass?: HomeAssistant;
  config?: Config;
}

// Each card element must get its own store: a module-level singleton here
// would be shared by every card instance on the dashboard, so the last
// instance to call setConfig()/set hass() would clobber what every other
// instance renders.
export const createStore = () => create<Store>(() => ({}));

export type RoomStore = UseBoundStore<StoreApi<Store>>;

export const StoreContext = createContext<RoomStore | null>(null);

export const useStore = <T,>(selector: (state: Store) => T): T => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreContext.Provider');
  }
  return store(selector);
};
