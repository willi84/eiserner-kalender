import type { Spiel } from '@component/calendar/events/events.d';
import { getEvents } from '@component/calendar/events/events';
import { createLotteryCalendarDebugReport, getEventItemsFromEndpoints } from './apps/lottery/lottery';
import type { LotteryCalendarDebugReport, LotteryExport } from '@apps/lottery/lottery.d';
import {
    createTeamSynonymsOutputContent,
    getTeamSynonymsOutputFile,
} from './teams/team-synonyms/team-synonyms';
import { LOG } from '@_shared/log/log';
import { DEFAULT_SEARCH_TERMS, OUTPUT_DIR } from '@config/config';
import { BASE_NEWS, CALENDAR_URLS, SEARCH_ENDPOINT } from '@config/endpoints';
import { FS } from '@_shared/fs/fs';
import { getText } from '@_shared/fetch/fetch';
import { ENDPOINT } from '@config/endpoint';
import type { Json} from '@_shared/types'
import { createEventJSON, toIcs, toJson } from '@component/calendar/convert/convert';
import { substitute } from '@_shared/tools/tools';

type CalendarExport = {
    label: string;
    outputFile: string;
    url: string;
};

export type ExportResult = {
    updatedAt: string;
    calendarSpiele?: Spiel[];
    content: string;
    format: 'json' | 'ics';
    json: string;
    label: string;
    outputFile: string;
};

const LEGACY_OUTPUT_FILES = ['events.json'];
const DEBUG_EXPORT = process.env.DEBUG_EXPORT === 'true';
const CALENDARS: CalendarExport[] = [
    {
        label: 'Männer',
        outputFile: 'unionspiele_maenner.json',
        url: CALENDAR_URLS['FCU_MALE'],
    },
    {
        label: 'Frauen',
        outputFile: 'unionspiele_frauen.json',
        url: CALENDAR_URLS['FCU_FEMALE'],
    },
];

const createLotteryDebugConsoleOutput = (debug: LotteryCalendarDebugReport) => {
    LOG.OK('[debug][lottery] Kalenderabgleich abgeschlossen');
    LOG.INFO(`[debug][lottery] Suchbegriffe: ${debug.searchTerms.join(', ') || 'keine konfiguriert'}`);
    LOG.INFO(
        `[debug][lottery] Erkannte Heimspiele aus Kalender: ${debug.recognizedCalendarGameCount}/${debug.calendarGameCount}`,
    );
    LOG.INFO(
        `[debug][lottery] Fehlende Kalender-Spiele: ${debug.missingCalendarGames.join(', ') || 'keine'}`,
    );
    LOG.INFO(
        `[debug][lottery] Spiele nicht im Kalender: ${debug.unmatchedLotteryGames.join(', ') || 'keine'}`,
    );
};

const fetchIcs = (url: string) => {
    const ics = getText(url);
    LOG.OK('ICS download finished', { url});
    return ics;
};

const writeOutputFile = (fileName: string, content: string) => {
    const PATH = `${OUTPUT_DIR}/${fileName}`;
    FS.writeFile(PATH, content);
    LOG.OK(`Output file ${fileName} written`, {
        fileName,
        bytes: FS.size(PATH),
    });
};

const copyAssetFile = (sourcePath: string, outputFile: string) => {
    const content = FS.readFile(sourcePath, { encoding: null });

    if (!content || !Buffer.isBuffer(content)) {
        LOG.FAIL(`Asset file ${outputFile} could not be copied`);
        return;
    }

    const path = `${OUTPUT_DIR}/${outputFile}`;
    FS.writeFile(path, content);
    LOG.OK(`Asset file ${outputFile} written`, {
        fileName: outputFile,
        bytes: FS.size(path),
    });
};

const removeLegacyOutputFiles = () => {
    LOG.INFO('Removing legacy output files', { files: LEGACY_OUTPUT_FILES });
    LEGACY_OUTPUT_FILES.map((fileName) => FS.removeFile(`${OUTPUT_DIR}/${fileName}`));
};

const exportCalendar = ({ label, outputFile, url }: CalendarExport): ExportResult => {
    LOG.INFO('Calendar export started', { label, outputFile, url });
    const ics = fetchIcs(url);
    const updatedAt = new Date().toISOString().slice(0, 10);
    const events = getEvents(url, ics, updatedAt, DEBUG_EXPORT);
    const json = JSON.stringify(events, null, 2);

    LOG.INFO('Calendar export parsed', {
        label,
        outputFile,
        eventCount: events.spiele.length,
        updatedAt,
    });

    return {
        updatedAt,
        calendarSpiele: events.spiele,
        content: json,
        format: 'json',
        json,
        label,
        outputFile,
    };
};
const exportItem = (updatedAt: string, content: string, label: string, outputFile: string): ExportResult[] => {
    return [
        {
            updatedAt,
            content,
            format: 'json',
            json: content,
            label,
            outputFile,
        }
    ];
}

const createLotteryExportResults = (input: Json): ExportResult[] => {
    const updatedAt = input.source.updatedAt;
    const ics = toIcs(input);
    const json = toJson(input);
    const jsonStr = JSON.stringify(json, null, 2);
    return [
        ...exportItem(updatedAt, jsonStr, 'Losverfahren JSON', 'union_lottery.json'),
        ...exportItem(updatedAt, ics, 'Losverfahren iCal', 'union_lottery.ics'),
    ];
};
export type EXPORT_ITEM = {
    updatedAt: string;
    content: string;
    format: 'json' | 'ics';
    label: string;
    outputFile: string;
}

const createTeamSynonymExportResult = (item: EXPORT_ITEM): ExportResult => {
    const updatedAt = item.updatedAt;
    const content = item.content;
    const label = item.label;
    const outputFile = item.outputFile;
    // const content = createTeamSynonymsOutputContent();
    // const file = getTeamSynonymsOutputFile();
    // const updatedAt = new Date().toISOString().slice(0, 10);

    return exportItem(updatedAt, content, label, outputFile)[0];
};

export const createIndexHtml = (exports: ExportResult[], lotteryDebug: LotteryCalendarDebugReport) => {
    const listItems = exports
        .map(({ updatedAt, format, label, outputFile }) => {
            return `<li><article class="file-card"><strong>${label}</strong><div class="file-meta"><span>Format: ${format.toUpperCase()}</span><span>Erstellt am: ${updatedAt}</span></div><p class="file-name">${outputFile}</p><a class="file-link" href="./${outputFile}">Datei öffnen</a></article></li>`;
        })
        .join('\n');
    const logo = FS.readFile('./src/assets/logo.svg') || '';
    const TEMPLATE: string = FS.readFile('./src/index.html') || '';
    let HTML = substitute(TEMPLATE, {
        listItems,
        logo,
        searchTerms: lotteryDebug.searchTerms.join(', ') || 'keine konfiguriert',
        recognizedCalendarGameCount: lotteryDebug.recognizedCalendarGameCount,
        calendarGameCount: lotteryDebug.calendarGameCount,
        missingCalendarGames: lotteryDebug.missingCalendarGames.join(', ') || 'keine',
        unmatchedLotteryGames: lotteryDebug.unmatchedLotteryGames.join(', ') || 'keine',
    });
    return HTML;
};

export const runExport = () => {
    const calendars = CALENDARS.map(({ label, outputFile, url }) => ({ label, outputFile, url }));
    LOG.INFO(`Export run started for calendars: ${calendars.map(({ label }) => label).join(', ')}`);

    const calendarExports = CALENDARS.map(exportCalendar);
    const menCalendarGames =
        calendarExports
            .find(({ outputFile }) => outputFile === 'unionspiele_maenner.json')
            ?.calendarSpiele?.filter(({ spielort }) => spielort === 'heim') ?? [];
            const searchTerms = DEFAULT_SEARCH_TERMS;
    const endpoint: ENDPOINT = {
        url: SEARCH_ENDPOINT,
        host: BASE_NEWS,
    }
    const items = getEventItemsFromEndpoints(endpoint, searchTerms);
    const updatedAt = new Date().toISOString().slice(0, 10);
    const source = {
        searchTerms,
        endpoint: endpoint.url,
        updatedAt,
    }
    const json: Json = createEventJSON(items, source);
    const debug = createLotteryCalendarDebugReport(menCalendarGames, json.termine, searchTerms)

    const lotteryExports = createLotteryExportResults(json);
    const teamSynonmyItem: EXPORT_ITEM = {
        updatedAt,
        content: createTeamSynonymsOutputContent(),
        format: 'json',
        label: 'Mannschafts-Synonyme',
        outputFile: getTeamSynonymsOutputFile(),
    };

    const teamSynonymExport = createTeamSynonymExportResult(teamSynonmyItem);
    const EXPORT_FILES: ExportResult[] = [...calendarExports, ...lotteryExports, teamSynonymExport];

    removeLegacyOutputFiles();
    EXPORT_FILES.map(({ content, outputFile }) => writeOutputFile(outputFile, content));
    writeOutputFile('index.html', createIndexHtml(EXPORT_FILES, debug));
    writeOutputFile('assets/favicon.svg', FS.readFile('./src/assets/favicon.svg') || '');
    copyAssetFile('./src/assets/favicon.png', 'assets/favicon.png');
    createLotteryDebugConsoleOutput(debug);

    const exportedFiles = EXPORT_FILES.map(({ label, outputFile }) => ({ label, outputFile }));
    LOG.OK('Export run finished');
    // LOG.OK('Export run finished', { exportedFiles });
};

const isDirectExecution = process.argv[1]?.endsWith('src/index.ts');

if (isDirectExecution) {
    runExport();
    // TODO: process.exit = 1;
}
