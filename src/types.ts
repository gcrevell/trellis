export type RoomAction = {
  icon: string;
  enabled_entity: string;
  script: string;
  data?: Record<string, unknown>;
};

export type NavigateIconAction = {
  type: 'navigate';
  path: string;
};

export type IconAction = NavigateIconAction;

export type Room = {
  name: string;
  icon: string;
  brightness_entity?: string;
  actions?: RoomAction[];
  icon_action?: IconAction;
};

export type Config = Room & {
  type: string;
};
