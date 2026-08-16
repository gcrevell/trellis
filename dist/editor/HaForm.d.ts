import { HomeAssistant } from 'custom-card-helpers';
import { FunctionComponent } from 'preact';
export type FormSchema = Record<string, unknown>;
type Props = {
    hass?: HomeAssistant;
    data: Record<string, unknown>;
    schema: FormSchema[];
    computeLabel: (schema: FormSchema) => string;
    onChange: (data: Record<string, unknown>) => void;
};
export declare const HaForm: FunctionComponent<Props>;
export {};
