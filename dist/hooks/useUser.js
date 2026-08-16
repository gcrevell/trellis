import { useCallback } from 'preact/hooks';
import { useStore } from '../store';
export const useUser = () => {
    const user = useStore((state) => { var _a; return (_a = state.hass) === null || _a === void 0 ? void 0 : _a.user; });
    const entity = useStore(useCallback(({ hass }) => (user
        ? Object.values(hass === null || hass === void 0 ? void 0 : hass.states).find(({ attributes }) => (attributes === null || attributes === void 0 ? void 0 : attributes.user_id) === user.id)
        : undefined), [user]));
    return Object.assign(Object.assign({}, user), { entity });
};
