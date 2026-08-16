import { jsx as _jsx } from "preact/jsx-runtime";
import { useEffect, useRef } from 'preact/hooks';
// ha-form fires a `value-changed` event, which Preact can't bind via an
// `onValue-changed`-style prop (its onX->event-name mapping only lowercases,
// it doesn't split on dashes), so the listener has to be wired up manually.
export const HaForm = ({ hass, data, schema, computeLabel, onChange, }) => {
    const ref = useRef(null);
    // Assigning `schema`/`data` in a useEffect fires after paint — too late,
    // since ha-form (a Lit element) schedules its first update as a microtask
    // as soon as it's connected, which can run before that effect and crash
    // reading `schema.map()` while it's still undefined. A ref callback runs
    // synchronously during Preact's commit, before any microtask, so the
    // properties are always set before ha-form's first render.
    const assign = (el) => {
        ref.current = el;
        if (!el)
            return;
        el.hass = hass;
        el.data = data;
        el.schema = schema;
        el.computeLabel = computeLabel;
    };
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return undefined;
        const handler = (event) => {
            event.stopPropagation();
            onChange(event.detail.value);
        };
        el.addEventListener('value-changed', handler);
        return () => el.removeEventListener('value-changed', handler);
    }, [onChange]);
    return _jsx("ha-form", { ref: assign });
};
