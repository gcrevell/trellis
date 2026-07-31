export type RoomAction = {
  icon: string;
  enabledEntity: string;
  script: string;
  data?: Record<string, unknown>;
};

export type Room = {
  name: string;
  icon: string;
  brightnessEntity?: string;
  actions?: RoomAction[];
};

export type Config = Room & {
  type: string;
};
