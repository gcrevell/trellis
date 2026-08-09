import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../store';

export type ForecastType = 'daily' | 'hourly' | 'twice_daily';

export interface ForecastAttributes {
  datetime: string;
  condition?: string;
  temperature?: number;
  templow?: number;
  precipitation?: number;
  precipitation_probability?: number;
  wind_speed?: number;
  wind_bearing?: number;
  humidity?: number;
  is_daytime?: boolean;
  [key: string]: unknown;
}

interface ForecastEvent {
  type: ForecastType;
  forecast: ForecastAttributes[];
}

// HA hands the card a brand new `hass` object on every state change anywhere
// in the system, so keying the subscription effect on `hass` itself would tear
// the WS subscription down and rebuild it constantly. `hass.connection` is stable
// across those re-renders, so it's the only piece of `hass` this hook
// actually depends on for its effect.
export const useForecast = (entityId?: string, type?: ForecastType) => {
  const hass = useStore((state) => state.hass);
  const connection = hass?.connection;
  const [forecast, setForecast] = useState<ForecastAttributes[] | undefined>(undefined);
  const [error, setError] = useState<unknown>(undefined);

  useEffect(() => {
    setForecast(undefined);
    setError(undefined);

    if (!connection || !entityId || !type) return undefined;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    connection.subscribeMessage<ForecastEvent>(
      (event: ForecastEvent) => {
        if (cancelled) return;
        setForecast(event.forecast);
      },
      {
        type: 'weather/subscribe_forecast',
        entity_id: entityId,
        forecast_type: type,
      },
    ).then((unsub: () => void) => {
      if (cancelled) {
        unsub();
        return;
      }
      unsubscribe = unsub;
    }).catch((err: unknown) => {
      if (cancelled) return;
      setError(err);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [connection, entityId, type]);

  // Falls back to whatever forecast the entity already published as a state
  // attribute (legacy weather integrations that never adopted the
  // subscription API) — a zero-request read, not the get_forecasts service
  // call, which only fires on demand and was deliberately left out.
  const entityForecast = useStore((state) => (
    entityId ? (state.hass?.states[entityId]?.attributes.forecast as ForecastAttributes[] | undefined) : undefined
  ));

  if (forecast === undefined && error !== undefined) {
    return { forecast: entityForecast, error };
  }

  return { forecast, error };
};
