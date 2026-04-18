import * as path from 'path';
import { LogType, colors } from './log.config';
import type { COLOR_SET, LogOpts, LogItem, PARAMS } from './log.d';
// TODO: move to other file
// const isMicrosoft = os.release().toLocaleLowerCase().includes('microsoft');
// const hasLinuxPlattform = process.platform.includes('linux');
// const isVSCode = (process.env.TERM_PROGRAM && process.env.TERM_PROGRAM.includes('vscode'));
// let noEmojis = isMicrosoft && hasLinuxPlattform && (!isVSCode);
// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color


export const COLOR_SETS = {
    [LogType.OK]: { id: 'OK', fg: colors.FgBlack, bg: colors.BgGreen },
    [LogType.FAIL]: { id: 'FAIL', fg: colors.FgWhite, bg: colors.BgRed },
    [LogType.WARN]: { id: 'WARN', fg: colors.FgWhite, bg: colors.BgYellow },
    [LogType.INFO]: { id: 'INFO', fg: colors.FgBlack, bg: colors.BgWhite },
    [LogType.DEFAULT]: {
        id: 'DEFAULT',
        fg: colors.FgWhite,
        bg: colors.BgBlack,
    },
    [LogType.INLINE]: { id: 'INLINE', fg: colors.FgWhite, bg: colors.BgBlack },
    [LogType.DEBUG]: { id: 'DEBUG', fg: colors.FgBlack, bg: colors.BgWhite },
    // [LogType.NEWLINE]: { id: 'NEWLINE', fg: colors.FgWhite, bg: colors.BgBlack },
};
const getColorSet = (type: LogType): COLOR_SET => {
    const resolvedType = type as keyof typeof COLOR_SETS;
    const colorSet: COLOR_SET = COLOR_SETS[resolvedType] as COLOR_SET;
    return colorSet;
};

const makeLogger = (type: LogType) => (msg: string, params?: PARAMS, opts?: LogOpts) => {
    LOG.logger(type, msg, { ...opts, params });
};

export const colorize = (msg: string, bg: string, fg: string) => {
    const colorSet = ` ${fg} ${bg} `;
    const result = `${colorSet}  ${msg}  ${colors.Reset} `;
    return msg !== '' ? `${result}` : '';
};

export class LOG {
    static colorize = colorize;
    static output = (msg: string) => {
        process.stdout.write(`${msg}`);
    };
    static logger(type: LogType, msg: string, opts?: LogOpts) {
        const color = getColorSet(type);
        const icon = opts?.icon || '';
        const params = opts?.params ? ` ${JSON.stringify(opts.params)}` : '';
        const isInline = type === LogType.INLINE || type === LogType.DEFAULT;
        const needSpaces = type.length < 4;
        const spaces = needSpaces ? ' '.repeat((4 - type.length) / 2) : '';
        const txt = isInline ? '' : `[${spaces}${color.id}${spaces}]`;
        const status = LOG.colorize(txt, color.bg, color.fg);
        const isNewline = type !== LogType.INLINE;
        LOG.output(`${status}${icon}${msg}${params}${isNewline ? '\n' : ''}`);
    }
    static OK = makeLogger(LogType.OK);
    static FAIL = makeLogger(LogType.FAIL);
    static WARN = makeLogger(LogType.WARN);
    static INFO = makeLogger(LogType.INFO);
    static DEFAULT = makeLogger(LogType.DEFAULT);
    static INLINE = makeLogger(LogType.INLINE);
    static DEBUG = makeLogger(LogType.DEBUG);
}

export class _LOG {
    items: LogItem[];
    constructor() {
        this.items = [];
    }
    doLog(type: LogType, msg: string, items: LogItem[], telemetry: any = {}) {
        const time = new Date().getTime();
        const logItem: LogItem = {
            message: msg,
            type,
            time,
            telemetry,
        };
        items.push(logItem);
    }
    getItems() {
        return this.items.map((item: LogItem) => {
            return {
                message: item.message,
                type: item.type,
            };
        });
    }

    OK(msg: string, telemetry: any = {}) {
        this.doLog(LogType.OK, msg, this.items, telemetry);
    }
    FAIL(msg: string, telemetry: any = {}) {
        this.doLog(LogType.FAIL, msg, this.items, telemetry);
    }
    WARN(msg: string, telemetry: any = {}) {
        this.doLog(LogType.WARN, msg, this.items, telemetry);
    }
    INFO(msg: string, telemetry: any = {}) {
        this.doLog(LogType.INFO, msg, this.items, telemetry);
    }
    DEFAULT(msg: string, telemetry: any = {}) {
        this.doLog(LogType.DEFAULT, msg, this.items, telemetry);
    }
    INLINE(msg: string, telemetry: any = {}) {
        this.doLog(LogType.INLINE, msg, this.items, telemetry);
    }
    DEBUG(msg: string, telemetry: any = {}) {
        this.doLog(LogType.DEBUG, msg, this.items, telemetry);
    }
}