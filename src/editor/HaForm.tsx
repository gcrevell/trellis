import { HomeAssistant } from 'custom-card-helpers';
import { FunctionComponent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

export type FormSchema = Record<string, unknown>;

type HaFormElement = HTMLElement & {
  hass?: HomeAssistant;
  data?: Record<string, unknown>;
  schema?: FormSchema[];
  computeLabel?: (schema: FormSchema) => string;
};

type Props = {
  hass?: HomeAssistant;
  data: Record<string, unknown>;
  schema: FormSchema[];
  computeLabel: (schema: FormSchema) => string;
  onChange: (data: Record<string, unknown>) => void;
};

// ha-form fires a `value-changed` event, which Preact can't bind via an
// `onValue-changed`-style prop (its onX->event-name mapping only lowercases,
// it doesn't split on dashes), so the listener has to be wired up manually.
export const HaForm: FunctionComponent<Props> = ({
  hass, data, schema, computeLabel, onChange,
}) => {
  const ref = useRef<HaFormElement>(null);

  // Assigning `schema`/`data` in a useEffect fires after paint — too late,
  // since ha-form (a Lit element) schedules its first update as a microtask
  // as soon as it's connected, which can run before that effect and crash
  // reading `schema.map()` while it's still undefined. A ref callback runs
  // synchronously during Preact's commit, before any microtask, so the
  // properties are always set before ha-form's first render.
  const assign = (el: HaFormElement | null) => {
    ref.current = el;
    if (!el) return;
    el.hass = hass;
    el.data = data;
    el.schema = schema;
    el.computeLabel = computeLabel;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const handler = (event: Event) => {
      event.stopPropagation();
      onChange((event as CustomEvent<{ value: Record<string, unknown> }>).detail.value);
    };
    el.addEventListener('value-changed', handler);
    return () => el.removeEventListener('value-changed', handler);
  }, [onChange]);

  return <ha-form ref={assign} />;
};
