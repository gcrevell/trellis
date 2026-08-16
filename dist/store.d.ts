import { StoreApi, UseBoundStore } from 'zustand';
import { HomeAssistant } from 'custom-card-helpers';
import { BaseConfig } from './types';
interface Store {
    hass?: HomeAssistant;
    config?: BaseConfig;
}
export declare const createStore: () => UseBoundStore<StoreApi<Store>>;
export type RoomStore = UseBoundStore<StoreApi<Store>>;
export declare const StoreContext: import("preact").Context<RoomStore>;
export declare const useStore: <T>(selector: (state: Store) => T) => T;
export {};
