import * as readline from 'readline';
import { colors, LogType } from './log.config';
import { COLOR_SETS, LOG } from './log';
import type { COLOR_SET, LogOpts } from './log.d';
const { execSync } = require('child_process');
const clearOutput = true; // for debugging purposes

let spyLog: jest.SpyInstance;
let spyColorize: jest.SpyInstance;
describe('test logger', () => {
    it('should format the message correctly', () => {
        const spyOutput = jest.spyOn(LOG, 'output');
        const msg = 'Test LOGGING message';
        const type = LogType.OK;
        LOG.logger(type, msg, {});
        const result = ` ${colors.FgBlack} ${colors.BgGreen}   [ ${type} ]  ${colors.Reset} ${msg}\n`;
        expect(spyOutput).toHaveBeenCalledWith(result);
        spyOutput.mockRestore();
    });
});

const CASES = [
    { test: 'log.ok has green output', fn: LOG.OK, id: 'OK' },
    { test: 'log.fail has red output', fn: LOG.FAIL, id: 'FAIL' },
    { test: 'log.warn has yellow output', fn: LOG.WARN, id: 'WARN' },
    { test: 'log.info has white output', fn: LOG.INFO, id: 'INFO' },
    { test: 'log.default has green output', fn: LOG.DEFAULT, id: 'DEFAULT' },
    { test: 'log.inline has white output', fn: LOG.INLINE, id: 'INLINE' },
    { test: 'log.debug has white output', fn: LOG.DEBUG, id: 'DEBUG' },
];
const SCENARIOS: any = {
    'without newline': {},
    'withnewline=true': { newline: true },
    'withnewline=false': { newline: false },
};
describe('log library', () => {
    beforeEach(() => {
        spyLog = jest.spyOn(LOG, 'logger');
        spyColorize = jest.spyOn(LOG, 'colorize');
    });
    afterEach(() => {
        jest.clearAllMocks();
        spyLog.mockRestore();
        spyColorize.mockRestore();
        // clear output if tests successful
        if (clearOutput) readline.cursorTo(process.stdout, 0, 0);
    });

    const getTypeFromStatus = (status: string): string => {
        const item = COLOR_SETS[status as keyof typeof COLOR_SETS];
        const type = item.id;
        return type as string;
    };

    const SCENARIO_KEYS = Object.keys(SCENARIOS);
    SCENARIO_KEYS.forEach((KEY: string) => {
        const SCENARIO = SCENARIOS[KEY];
        const hasNewline = SCENARIO.hasOwnProperty('newline');
        describe.each(CASES.map((CASE) => [CASE]))(
            `test logs ${KEY}`,
            (CASE) => {
                it(`${CASE.test}`, async () => {
                    const opts: LogOpts = {};
                    if (hasNewline) {
                        opts['newline'] = SCENARIO.newline;
                    }
                    const params = {};
                    CASE.fn('foobar', params, opts);
                    const type = getTypeFromStatus(CASE.id);
                    expect(spyLog).toHaveBeenCalledWith(type, 'foobar', {
                        ...opts,
                        params,
                    });
                    const colorSet: COLOR_SET =
                        COLOR_SETS[type as keyof typeof COLOR_SETS];
                    const id = CASE.id;
                    const isEmpty = id === 'DEFAULT' || id === 'INLINE';
                    const needSpaces = id.length < 4;
                    const spaces = needSpaces ? ' '.repeat((4 - id.length) / 2) : '';
                    const status = isEmpty ? '' : '[' + spaces + id + spaces + ']';
                    expect(spyColorize).toHaveBeenCalledWith(
                        status,
                        colorSet.bg,
                        colorSet.fg
                    );
                });
                it(`${CASE.test} with icon`, async () => {
                    const hasNewline = SCENARIO.hasOwnProperty('newline');
                    const opts = {
                        icon: 'xxx',
                        newline: SCENARIO.newline,
                    };
                    const params = {};
                    CASE.fn('foobar', params, opts);
                    const type = getTypeFromStatus(CASE.id || 'DEFAULT');
                    expect(spyLog).toHaveBeenCalledWith(type, 'foobar', {
                        ...opts,
                        params,
                    });
                    const colorSet: COLOR_SET =
                        COLOR_SETS[type as keyof typeof COLOR_SETS];
                    const id = CASE.id;
                    const isEmpty = id === 'DEFAULT' || id === 'INLINE';
                    const needSpaces = id.length < 4;
                    const spaces = needSpaces ? ' '.repeat((4 - id.length) / 2) : '';
                    const status = isEmpty ? '' : '[' + spaces + id + spaces + ']';
                    expect(spyColorize).toHaveBeenCalledWith(
                        status,
                        colorSet.bg,
                        colorSet.fg
                    );
                });
                afterEach(() => {
                    if (clearOutput && !hasNewline)
                        readline.cursorTo(process.stdout, 0, 0);
                    // if (clearOutput && hasNewline) execSync('clear'); // not working in CI
                });
            }
        );
    });
});