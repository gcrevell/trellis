import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';
// HA hands the card a brand new `hass` object on every state change anywhere
// in the system, so keying the subscription effect on `hass` itself would tear
// the WS subscription down and rebuild it constantly. `hass.connection` is stable
// across those re-renders, so it's the only piece of `hass` this hook
// actually depends on for its effect.
export const useForecast = (entityId, type) => {
    const hass = useStore((state) => state.hass);
    const connection = hass === null || hass === void 0 ? void 0 : hass.connection;
    const [forecast, setForecast] = useState(undefined);
    const [error, setError] = useState(undefined);
    useEffect(() => {
        setForecast(undefined);
        setError(undefined);
        if (!connection || !entityId || !type)
            return undefined;
        let cancelled = false;
        let unsubscribe;
        connection.subscribeMessage((event) => {
            if (cancelled)
                return;
            setForecast(event.forecast);
        }, {
            type: 'weather/subscribe_forecast',
            entity_id: entityId,
            forecast_type: type,
        }).then((unsub) => {
            if (cancelled) {
                unsub();
                return;
            }
            unsubscribe = unsub;
        }).catch((err) => {
            if (cancelled)
                return;
            setError(err);
        });
        return () => {
            cancelled = true;
            unsubscribe === null || unsubscribe === void 0 ? void 0 : unsubscribe();
        };
    }, [connection, entityId, type]);
    // Falls back to whatever forecast the entity already published as a state
    // attribute (legacy weather integrations that never adopted the
    // subscription API) — a zero-request read, not the get_forecasts service
    // call, which only fires on demand and was deliberately left out.
    const entityForecast = useStore((state) => {
        var _a, _b;
        return (entityId ? (_b = (_a = state.hass) === null || _a === void 0 ? void 0 : _a.states[entityId]) === null || _b === void 0 ? void 0 : _b.attributes.forecast : undefined);
    });
    if (forecast === undefined && error !== undefined) {
        return { forecast: entityForecast, error };
    }
    return { forecast, error };
};
