import { LogType } from './log.config';
export type COLOR_SET = {
    id: string;
    fg: string;
    bg: string;
};
export type PARAMS = Record<string, unknown>;

export type LogOpts = {
    icon?: string;
    newline?: boolean;
    params?: PARAMS;
};
export type LogItem = {
    message: string;
    type: LogType;
    time: number;
    telemetry?: any;
};