import { mkdir, rm, writeFile } from 'node:fs/promises';
import type { Spiel } from './events/events';
import { getEvents } from './events/events';
import { createLotteryExport, type LotteryCalendarDebugReport, type LotteryExport } from './lottery/lottery';
import {
    createTeamSynonymsOutputContent,
    getTeamSynonymsOutputFile,
} from './teams/team-synonyms/team-synonyms';

type CalendarExport = {
    label: string;
    outputFile: string;
    url: string;
};

type ExportResult = {
    abgerufenAm: string;
    calendarSpiele?: Spiel[];
    content: string;
    format: 'json' | 'ics';
    json: string;
    label: string;
    outputFile: string;
};

const OUTPUT_DIR = 'output';
const LEGACY_OUTPUT_FILES = ['events.json'];
const DEBUG_EXPORT = process.env.DEBUG_EXPORT === 'true';
const CALENDARS: CalendarExport[] = [
    {
        label: 'Männer',
        outputFile: 'unionspiele_maenner.json',
        url: 'https://kalender.textilvergehen.de/unionspiele_maenner.ics',
    },
    {
        label: 'Frauen',
        outputFile: 'unionspiele_frauen.json',
        url: 'https://kalender.textilvergehen.de/unionspiele_frauen.ics',
    },
];

const debugLog = (message: string, details?: Record<string, unknown>) => {
    if (!DEBUG_EXPORT) {
        return;
    }

    if (details) {
        console.debug(`[debug][export] ${message}`, details);
        return;
    }

    console.debug(`[debug][export] ${message}`);
};

const createDebugListItems = (items: string[]) => {
    if (items.length === 0) {
        return '          <li>Keine</li>';
    }

    return items.map((item) => `          <li>${item}</li>`).join('\n');
};

const createLotteryDebugConsoleOutput = (debug: LotteryCalendarDebugReport) => {
    console.log('[debug][lottery] Kalenderabgleich abgeschlossen');
    console.log(`[debug][lottery] Suchbegriffe: ${debug.searchTerms.join(', ') || 'keine konfiguriert'}`);
    console.log(
        `[debug][lottery] Erkannte Heimspiele aus Kalender: ${debug.recognizedCalendarGameCount}/${debug.calendarGameCount}`,
    );
    console.log(
        `[debug][lottery] Fehlende Kalender-Spiele: ${debug.missingCalendarGames.join(', ') || 'keine'}`,
    );
    console.log(
        `[debug][lottery] Spiele nicht im Kalender: ${debug.unmatchedLotteryGames.join(', ') || 'keine'}`,
    );
};

const fetchIcs = async (url: string) => {
    debugLog('ICS download started', { url });
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`ICS download failed for ${url} with status ${response.status}`);
    }

    const ics = await response.text();
    debugLog('ICS download finished', {
        url,
        status: response.status,
        contentLength: response.headers.get('content-length'),
        textLength: ics.length,
    });

    return ics;
};

const writeOutputFile = async (fileName: string, content: string) => {
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(`${OUTPUT_DIR}/${fileName}`, content);
    debugLog('Output file written', {
        fileName,
        bytes: Buffer.byteLength(content, 'utf8'),
    });
};

const removeLegacyOutputFiles = async () => {
    debugLog('Removing legacy output files', { files: LEGACY_OUTPUT_FILES });
    await Promise.all(
        LEGACY_OUTPUT_FILES.map((fileName) => rm(`${OUTPUT_DIR}/${fileName}`, { force: true })),
    );
};

const exportCalendar = async ({ label, outputFile, url }: CalendarExport): Promise<ExportResult> => {
    debugLog('Calendar export started', { label, outputFile, url });
    const ics = await fetchIcs(url);
    const abgerufenAm = new Date().toISOString().slice(0, 10);
    const events = getEvents(url, ics, abgerufenAm, DEBUG_EXPORT);
    const json = JSON.stringify(events, null, 2);

    debugLog('Calendar export parsed', {
        label,
        outputFile,
        eventCount: events.spiele.length,
        fetchedAt: abgerufenAm,
    });

    return {
        abgerufenAm,
        calendarSpiele: events.spiele,
        content: json,
        format: 'json',
        json,
        label,
        outputFile,
    };
};

const createLotteryExportResults = (lottery: LotteryExport): ExportResult[] => {
    return [
        {
            abgerufenAm: lottery.abgerufenAm,
            content: lottery.json,
            format: 'json',
            json: lottery.json,
            label: 'Losverfahren JSON',
            outputFile: 'union_lottery.json',
        },
        {
            abgerufenAm: lottery.abgerufenAm,
            content: lottery.ics,
            format: 'ics',
            json: lottery.json,
            label: 'Losverfahren iCal',
            outputFile: 'union_lottery.ics',
        },
    ];
};

const createTeamSynonymExportResult = async (): Promise<ExportResult> => {
    const content = createTeamSynonymsOutputContent();
    const abgerufenAm = new Date().toISOString().slice(0, 10);

    return {
        abgerufenAm,
        content,
        format: 'json',
        json: content,
        label: 'Mannschafts-Synonyme',
        outputFile: getTeamSynonymsOutputFile(),
    };
};

export const createIndexHtml = (exports: ExportResult[], lotteryDebug: LotteryCalendarDebugReport) => {
    const listItems = exports
        .map(({ abgerufenAm, format, label, outputFile }) => {
            return `      <li><a href="./${outputFile}">${label}</a> <span>Format: ${format.toUpperCase()} | Erstellt am: ${abgerufenAm}</span></li>`;
        })
        .join('\n');

    return [
        '<!DOCTYPE html>',
        '<html lang="de">',
        '  <head>',
        '    <meta charset="utf-8" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
        '    <title>Eiserner Kalender Export</title>',
        '  </head>',
        '  <body>',
        '    <main>',
        '      <h1>Eiserner Kalender Export</h1>',
        '      <ul>',
        listItems,
        '      </ul>',
        '      <section>',
        '        <h2>Debug Kalenderabgleich Losverfahren</h2>',
        `        <p>Suchbegriffe: ${lotteryDebug.searchTerms.join(', ') || 'keine konfiguriert'}</p>`,
        `        <p>Erkannte Heimspiele aus Kalender: ${lotteryDebug.recognizedCalendarGameCount}/${lotteryDebug.calendarGameCount}</p>`,
        '        <h3>Fehlende Kalender-Spiele</h3>',
        '        <ul>',
        createDebugListItems(lotteryDebug.missingCalendarGames),
        '        </ul>',
        '        <h3>Spiele nicht im Kalender</h3>',
        '        <ul>',
        createDebugListItems(lotteryDebug.unmatchedLotteryGames),
        '        </ul>',
        '      </section>',
        '    </main>',
        '  </body>',
        '</html>',
    ].join('\n');
};

export const runExport = async () => {
    debugLog('Export run started', {
        calendars: CALENDARS.map(({ label, outputFile, url }) => ({ label, outputFile, url })),
    });

    const calendarExports = await Promise.all(CALENDARS.map(exportCalendar));
    const menCalendarGames =
        calendarExports
            .find(({ outputFile }) => outputFile === 'unionspiele_maenner.json')
            ?.calendarSpiele?.filter(({ spielort }) => spielort === 'heim') ?? [];
    const lottery = createLotteryExport(menCalendarGames);
    const lotteryExports = createLotteryExportResults(lottery);
    const teamSynonymExport = await createTeamSynonymExportResult();
    const exports = [...calendarExports, ...lotteryExports, teamSynonymExport];

    await removeLegacyOutputFiles();
    await Promise.all(exports.map(({ content, outputFile }) => writeOutputFile(outputFile, content)));
    await writeOutputFile('index.html', createIndexHtml(exports, lottery.debug));
    createLotteryDebugConsoleOutput(lottery.debug);

    debugLog('Export run finished', {
        exportedFiles: exports.map(({ label, outputFile }) => ({ label, outputFile })),
    });

    exports.forEach(({ json, label }) => {
        // console.log(`${label}:`);
        // console.log(json);
    });
};

const isDirectExecution = process.argv[1]?.endsWith('src/index.ts');

if (isDirectExecution) {
    runExport().catch((error: Error) => {
        console.error('[error][export] Export failed', {
            message: error.message,
            stack: DEBUG_EXPORT ? error.stack : undefined,
        });
        process.exitCode = 1;
    });
}
