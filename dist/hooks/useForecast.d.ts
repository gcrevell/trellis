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
export declare const useForecast: (entityId?: string, type?: ForecastType) => {
    forecast: ForecastAttributes[];
    error: unknown;
};
