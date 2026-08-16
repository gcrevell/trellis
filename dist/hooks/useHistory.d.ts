interface Datum {
    last_changed: Date;
    state: string;
}
interface HistoryConfig {
    start?: Date;
    end?: Date;
}
export declare const useHistory: (entityId: string, config?: HistoryConfig) => {
    history: Datum[];
    entity: import("home-assistant-js-websocket").HassEntity;
};
export {};
