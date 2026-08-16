import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { create } from 'zustand';
// Each card element must get its own store: a module-level singleton here
// would be shared by every card instance on the dashboard, so the last
// instance to call setConfig()/set hass() would clobber what every other
// instance renders.
export const createStore = () => create(() => ({}));
export const StoreContext = createContext(null);
export const useStore = (selector) => {
    const store = useContext(StoreContext);
    if (!store) {
        throw new Error('useStore must be used within a StoreContext.Provider');
    }
    return store(selector);
};
