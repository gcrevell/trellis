export declare const useUser: () => {
    entity: import("home-assistant-js-websocket").HassEntity;
    id: string;
    is_owner: boolean;
    is_admin: boolean;
    name: string;
    credentials: import("custom-card-helpers").Credential[];
    mfa_modules: import("custom-card-helpers").MFAModule[];
};
