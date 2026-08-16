
# trellis

The shared base for building Home Assistant custom Lovelace cards with Preact.

Published as the `@zupre/core` package: a zustand store bridged into a Preact context, a
set of hooks over Home Assistant's state, an `<ha-form>` wrapper for card editors, and a
webpack config factory (`webpack.base.js`) that card packages call to get the loader rules
and preact aliasing.

Consumed as a git dependency pinned to a release tag:

```json
"@zupre/core": "github:gcrevell/trellis#v1.0.0"
```

Compiled output is committed to `dist/` and shipped with the tag, so an install needs no
build step of its own. See `CLAUDE.md` for why that is a requirement rather than a
convenience, and for how versions are cut.

#### Stack:
- [TypeScript](https://github.com/microsoft/TypeScript)
- [Preact](https://github.com/preactjs/preact) (rendering — not React, see below)
- [zustand](https://github.com/pmndrs/zustand) (state management)
- [CSS Modules](https://github.com/css-modules/css-modules) (styles, via css-loader + style-loader)
- [custom-card-helpers](https://github.com/custom-cards/custom-card-helpers) (Home Assistant utils + types)
- [home-assistant-js-websocket](https://github.com/home-assistant/home-assistant-js-websocket) (Home Assistant types)
- [webpack](https://github.com/webpack/webpack) (build system for consuming cards, configured by `webpack.base.js`)
- [ESLint](https://github.com/eslint/eslint) (linter, using typescript-eslint flat config)
- [Husky](https://github.com/typicode/husky) (pre-commit hooks)

## Hooks

- [`useEntity`](#useentityentityid-string)
- [`useEntities`](#useentitiesentityids-string)
- [`useHistory`](#usehistoryentityid-string-config-historyconfig)
- [`useForecast`](#useforecastentityid-string-type-forecasttype)
- [`useUser`](#useuser)
- [`useHass`](#usehass)
- [`useConfig`](#useconfig)


### `useEntity(entityId: string)`
---
Retrieves an entity by ID from the Home Assistant state. The entity will be `undefined` if the state
of HA is not loaded or if the entity does not exist.

**Returns:** `HassEntity | undefined`

**Example:**

```tsx
...

const Card = () => {
  const sun = useEntity('sun.sun'); // sun: HassEntity | undefined

  return (
    <div style={{ padding: '1rem' }}>
      <p>{ sun?.attributes.friendly_name }</p>
      <p>
        State:
        {' '}
        { sun?.state }
      </p>
    </div>
  );
};

...
```

[![Screenshot-2022-03-10-at-15-57-11-Overview-Home-Assistant.png](https://i.postimg.cc/13fY2p24/Screenshot-2022-03-10-at-15-57-11-Overview-Home-Assistant.png)](https://postimg.cc/CRpNffFV)

### `useEntities(entityIds: string[])`
---
Retrieves a record of entities by their IDs.

**Returns:** `Record<string, HassEntity | undefined>`

**Example:**

```tsx
...

const Card = () => {
  const lights = useEntities([
    'light.lamp',
    'light.ceiling',
    'light.outside',
  ]); // lights: Record<string, HassEntity | undefined>

  return (
    <div style={{ padding: '1rem' }}>
      <pre>
        { JSON.stringify(lights, null, 2) }
      </pre>
    </div>
  );
};

...
```

### `useHistory(entityId: string, config?: HistoryConfig)`
---
Retrieves the history for an entity's state. The optional `config` parameter takes two fields:

- `start: Date` - the starting time/date to base the history on
- `end: Date` - the ending time/date to base the history on

By default, this period is the last 24hrs.

**Types:**

```ts
type Datum = { last_changed: Date, state: string }

interface HistoryConfig = {
  start?: Date;
  end?: Date;
}
```

**Returns:** `{ history: Datum[]; entity: HassEntity | undefined }`

**Example:**

```tsx
...

const Card = () => {
  const { history, entity } = useHistory('sun.sun'); // { history: Datum[]; entity?: HassEntity }

  return (
    <div style={{ padding: '1rem' }}>
      <p>{ entity?.attributes.friendly_name }:</p>
      <p>{ entity?.state }</p>
      <p>
        Changed
        {' '}
        { history.length }
        {' '}
        times.
      </p>
    </div>
  );
};

...
```

### `useForecast(entityId?: string, type?: ForecastType)`
---
Subscribes to a weather entity's forecast over the Home Assistant websocket connection
(`weather/subscribe_forecast`) and returns the most recent forecast received. `forecast` is
`undefined` until the first message arrives, and the subscription is torn down and re-made
whenever `entityId` or `type` changes.

If the subscription fails — typically a legacy weather integration that never adopted the
subscription API — it falls back to whatever the entity already publishes in its `forecast`
state attribute, which costs no extra request. The `get_forecasts` service call is
deliberately not used.

**Types:**

```ts
type ForecastType = 'daily' | 'hourly' | 'twice_daily';

interface ForecastAttributes {
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
```

**Returns:** `{ forecast: ForecastAttributes[] | undefined; error: unknown }`

**Example:**

```tsx
...

const Card = () => {
  const { forecast } = useForecast('weather.home', 'daily');

  return (
    <div style={{ padding: '1rem' }}>
      { forecast?.slice(0, 3).map((day) => (
        <p key={day.datetime}>
          { day.condition }
          :
          {' '}
          { day.temperature }
        </p>
      )) }
    </div>
  );
};

...
```

### `useUser()`
---
Retrieves the currently signed in user and its corresponding `entity`.

**Returns:** `(CurrentUser & { entity: HassEntity | undefined }) | undefined`


**Example:**

```tsx
...

const Card = () => {
  const user = useUser(); // user: (CurrentUser & { entity: HassEntity | undefined }) | undefined

  return (
    <div style={{ padding: '1rem' }}>
      <p>{ user?.name }</p>
      <img src={user?.entity?.attributes.entity_picture || ''} />
    </div>
  );
};

...
```

### `useHass()`
---
Retrieves current Home Assistant instance. Useful for API/service calls.

**Returns:** `HomeAssistant | undefined`

**Example:**

```tsx
...

const Card = () => {
  const hass = useHass(); // hass: HomeAssistant | undefined

  return (
    <div style={{ padding: '1rem' }}>
      <button
        onClick={
          hass
            ? hass.callService('homeassistant', 'restart')
            : () => {}
        }
      >
        Restart
      </button>
    </div>
  );
};

...
```

### `useConfig()`
---
Retrieves the current config of the card. Here it is typed as `BaseConfig` — `{ type: string }`,
the only field every Lovelace card config is guaranteed to have. A consuming card wraps this
hook locally to cast the result to its own richer config type, rather than threading a type
parameter through the store and context.

**Returns:** `BaseConfig | undefined`

**Example:**

```tsx
...

const Card = () => {
  const config = useConfig(); // config: BaseConfig | undefined

  return (
    <div style={{ padding: '1rem' }}>
      <p>{ config?.type }</p>
    </div>
  );
};

...
```
[![Screenshot-2022-03-10-at-15-58-27-Overview-Home-Assistant.png](https://i.postimg.cc/8z9nS7g4/Screenshot-2022-03-10-at-15-58-27-Overview-Home-Assistant.png)](https://postimg.cc/Js3Q34nH)

