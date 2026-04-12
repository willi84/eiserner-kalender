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

const parseEventBlock = (block: string): Spiel => {
    const startsAtLine = readDateStart(block);
    const summary = readField(block, SUMMARY_PREFIX);
    const anstoss = toIsoDateTime(startsAtLine);
    const kickoffDate = new Date(anstoss);
    const { isoWeekYear, kalenderwoche } = getIsoWeek(kickoffDate);
    const { gegner, spielort } = parseTeams(summary);

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

export const convertIcsToJSON = (ics: string): Spiel[] => {
    return extractEventBlocks(ics).map(parseEventBlock);
};

export const getEvents = (url: string, ics: string, abgerufenAm: string): EventsResult => {
    const spiele = convertIcsToJSON(ics);

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
