import { toIsoDateTime } from '@_shared/date/date';
import { LOG } from '@_shared/log/log';
import { escapeCharSet } from '@_shared/sanitize/sanitize';
import type { IcalEvent } from './ical.d';

const ESCAPE_VALUES = ['\\', '\n', ',', ';'] as const;
const EVENT_BLOCK_PATTERN = /BEGIN:VEVENT\r?\n[\s\S]*?\r?\nEND:VEVENT/g;
const LINE_BREAK_PATTERN = /\r?\n/;

export const escapeIcal = (value: string) => {
    return escapeCharSet(value, ESCAPE_VALUES);
};

const toIcalDate = (value: string) => value.replace(/[-:]/g, '').slice(0, 15);

const createEventBlock = (event: IcalEvent, dtStamp: string) => {
    return [
        'BEGIN:VEVENT',
        `UID:${event.uid}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${toIcalDate(event.startsAt)}`,
        `DTEND:${toIcalDate(event.endsAt)}`,
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

