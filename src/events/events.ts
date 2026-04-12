type Spielort = 'heim' | 'auswaerts';

type Spiel = {
    datum: string;
    isoWeekYear: number;
    kalenderwoche: number;
    gegner: string;
    spielort: Spielort;
    anstoss: string;
};

type EventsResult = {
    verein: string;
    wettbewerb: string;
    saison: string;
    quelle: {
        name: string;
        url: string;
        abgerufenAm: string;
    };
    spiele: Spiel[];
};

const UNION = '1. FC Union Berlin';
const SUMMARY_PREFIX = 'SUMMARY:';
const EVENT_BLOCK_PATTERN = /BEGIN:VEVENT\r?\n[\s\S]*?\r?\nEND:VEVENT/g;
const LINE_BREAK_PATTERN = /\r?\n/;

const debugLog = (enabled: boolean, message: string, details?: Record<string, unknown>) => {
    if (!enabled) {
        return;
    }

    if (details) {
        console.debug(`[debug][events] ${message}`, details);
        return;
    }

    console.debug(`[debug][events] ${message}`);
};

const extractEventBlocks = (ics: string) => {
    const matches = ics.match(EVENT_BLOCK_PATTERN);
    return matches ?? [];
};

const readField = (block: string, prefix: string) => {
    const line = block
        .split(LINE_BREAK_PATTERN)
        .find((entry) => entry.startsWith(prefix));

    return line?.slice(prefix.length).trim() ?? '';
};

const readDateStart = (block: string) => {
    return block
        .split(LINE_BREAK_PATTERN)
        .find((entry) => entry.startsWith('DTSTART')) ?? '';
};

const parseTeams = (summary: string) => {
    const [homeTeam = '', awayTeam = ''] = summary.split(' vs. ');
    const isHome = homeTeam === UNION;
    const gegner = isHome ? awayTeam : homeTeam;

    return {
        gegner,
        spielort: (isHome ? 'heim' : 'auswaerts') as Spielort,
    };
};

const toIsoDateTime = (startsAtLine: string) => {
    const match = startsAtLine.match(/^DTSTART(?:;TZID="([+-]\d{2}:\d{2})")?:(\d{8})T(\d{6})$/);
    const timezone = match?.[1] ?? 'Z';
    const date = match?.[2] ?? '';
    const time = match?.[3] ?? '';
    const isoDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    const isoTime = `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;

    return `${isoDate}T${isoTime}${timezone}`;
};

const getIsoWeek = (date: Date) => {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return { isoWeekYear: target.getUTCFullYear(), kalenderwoche: week };
};

const parseEventBlock = (block: string, index: number, debug = false): Spiel => {
    const startsAtLine = readDateStart(block);
    const summary = readField(block, SUMMARY_PREFIX);

    if (!summary) {
        debugLog(debug, 'Event summary missing', { index });
    }

    if (!startsAtLine) {
        debugLog(debug, 'Event DTSTART missing', { index, summary });
    }

    const anstoss = toIsoDateTime(startsAtLine);
    const kickoffDate = new Date(anstoss);

    if (Number.isNaN(kickoffDate.getTime())) {
        debugLog(debug, 'Event kickoff could not be parsed', {
            index,
            startsAtLine,
            parsedKickoff: anstoss,
            summary,
        });
    }

    const { isoWeekYear, kalenderwoche } = getIsoWeek(kickoffDate);
    const { gegner, spielort } = parseTeams(summary);

    debugLog(debug, 'Event parsed', {
        index,
        summary,
        gegner,
        spielort,
        anstoss,
    });

    return {
        datum: anstoss.slice(0, 10),
        isoWeekYear,
        kalenderwoche,
        gegner,
        spielort,
        anstoss,
    };
};

const getSourceName = (url: string) => new URL(url).hostname;

export const convertIcsToJSON = (ics: string, debug = false): Spiel[] => {
    const blocks = extractEventBlocks(ics);

    debugLog(debug, 'VEVENT blocks extracted', {
        blockCount: blocks.length,
        icsLength: ics.length,
    });

    if (blocks.length === 0) {
        debugLog(debug, 'No VEVENT blocks found in ICS payload');
    }

    return blocks.map((block, index) => parseEventBlock(block, index, debug));
};

export const getEvents = (url: string, ics: string, abgerufenAm: string, debug = false): EventsResult => {
    const spiele = convertIcsToJSON(ics, debug);

    debugLog(debug, 'Events payload built', {
        url,
        fetchedAt: abgerufenAm,
        eventCount: spiele.length,
    });

    return {
        verein: UNION,
        wettbewerb: 'Bundesliga',
        saison: '2025/26',
        quelle: {
            name: getSourceName(url),
            url,
            abgerufenAm,
        },
        spiele,
    };
};
