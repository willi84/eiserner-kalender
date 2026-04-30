import { toIsoDateTime } from '@_shared/date/date';
import { LOG } from '@_shared/log/log';
import { escapeCharSet } from '@_shared/sanitize/sanitize';
import { CALENDAR_TIMEZONE, CALENDAR_TITLE } from '@config/config';
import type { IcalEvent } from './ical.d';

const ESCAPE_VALUES = ['\\', '\n', ',', ';'] as const;
const EVENT_BLOCK_PATTERN = /BEGIN:VEVENT\r?\n[\s\S]*?\r?\nEND:VEVENT/g;
const LINE_BREAK_PATTERN = /\r?\n/;
const VTIMEZONE_BLOCK = [
    'BEGIN:VTIMEZONE',
    `TZID:${CALENDAR_TIMEZONE}`,
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
];

export const escapeIcal = (value: string) => {
    return escapeCharSet(value, ESCAPE_VALUES);
};

const toIcalDate = (value: string) => value.replace(/[-:]/g, '').slice(0, 15);

const createEventBlock = (event: IcalEvent, dtStamp: string) => {
    return [
        'BEGIN:VEVENT',
        `UID:${event.uid}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART;TZID=${CALENDAR_TIMEZONE}:${toIcalDate(event.startsAt)}`,
        `DTEND;TZID=${CALENDAR_TIMEZONE}:${toIcalDate(event.endsAt)}`,
        `SUMMARY:${escapeIcal(event.summary)}`,
        `DESCRIPTION:${escapeIcal(event.description)}`,
        `URL:${escapeIcal(event.url)}`,
        'END:VEVENT',
    ].join('\r\n');
};

export const createIcsContent = (events: IcalEvent[]) => {
    const dtStamp = `${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`;
    const eventBlocks = events.map((event) => createEventBlock(event, dtStamp));

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Eiserner Kalender//Lottery//DE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${CALENDAR_TITLE}`,
        `X-WR-TIMEZONE:${CALENDAR_TIMEZONE}`,
        ...VTIMEZONE_BLOCK,
        ...eventBlocks,
        'END:VCALENDAR',
        '',
    ].join('\r\n');
};

export const extractEventBlocks = (ics: string) => {
    const matches = ics.match(EVENT_BLOCK_PATTERN);
    return matches ?? [];
};

export const readField = (block: string, prefix: string) => {
    const line = block
        .split(LINE_BREAK_PATTERN)
        .find((entry) => entry.startsWith(prefix));

    return line?.slice(prefix.length).trim() ?? '';
};

export const readDateStart = (block: string) => {
    return block
        .split(LINE_BREAK_PATTERN)
        .find((entry) => entry.startsWith('DTSTART')) ?? '';
};
export const getDateStart = (block: string, index: number): Date => {
    const startsAtLine = readDateStart(block);
    if (!startsAtLine) {
        LOG.FAIL('Event DTSTART missing', { index });
    }
    const isoDate = toIsoDateTime(startsAtLine);
    const kickoffDate = new Date(isoDate);

    if (Number.isNaN(kickoffDate.getTime())) {
        LOG.FAIL('Event kickoff could not be parsed', {
            index,
            startsAtLine,
            parsedKickoff: isoDate,
        });
    }
    return kickoffDate;
};
