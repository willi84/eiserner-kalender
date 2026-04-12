import { mkdir, rm, writeFile } from 'node:fs/promises';
import { getEvents } from './events/events';

type CalendarExport = {
    label: string;
    outputFile: string;
    url: string;
};

type ExportResult = {
    abgerufenAm: string;
    json: string;
    label: string;
    outputFile: string;
};

const OUTPUT_DIR = 'output';
const LEGACY_OUTPUT_FILES = ['events.json'];
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

const fetchIcs = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`ICS download failed for ${url} with status ${response.status}`);
    }

    return response.text();
};

const writeOutputFile = async (fileName: string, content: string) => {
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(`${OUTPUT_DIR}/${fileName}`, content);
};

const removeLegacyOutputFiles = async () => {
    await Promise.all(
        LEGACY_OUTPUT_FILES.map((fileName) => rm(`${OUTPUT_DIR}/${fileName}`, { force: true })),
    );
};

const exportCalendar = async ({ label, outputFile, url }: CalendarExport): Promise<ExportResult> => {
    const ics = await fetchIcs(url);
    const abgerufenAm = new Date().toISOString().slice(0, 10);
    const events = getEvents(url, ics, abgerufenAm);

    return {
        abgerufenAm,
        json: JSON.stringify(events, null, 2),
        label,
        outputFile,
    };
};

export const createIndexHtml = (exports: ExportResult[]) => {
    const listItems = exports
        .map(({ abgerufenAm, label, outputFile }) => {
            return `      <li><a href="./${outputFile}">${label} JSON</a> <span>Erstellt am: ${abgerufenAm}</span></li>`;
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
        '    </main>',
        '  </body>',
        '</html>',
    ].join('\n');
};

export const runExport = async () => {
    const exports = await Promise.all(CALENDARS.map(exportCalendar));

    await removeLegacyOutputFiles();
    await Promise.all(exports.map(({ json, outputFile }) => writeOutputFile(outputFile, json)));
    await writeOutputFile('index.html', createIndexHtml(exports));

    exports.forEach(({ json, label }) => {
        console.log(`${label}:`);
        console.log(json);
    });
};

const isDirectExecution = process.argv[1]?.endsWith('src/index.ts');

if (isDirectExecution) {
    runExport().catch((error: Error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
