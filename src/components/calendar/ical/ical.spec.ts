import { createIcsContent, escapeIcal, extractEventBlocks, readDateStart, readField } from './ical';

describe('escapeIcal()', () => {
    const FN = escapeIcal;

    it('escapes backslashes, newlines, commas, and semicolons correctly', () => {
        expect(FN('Line with \\ backslash')).toBe('Line with \\\\ backslash');
        expect(FN('Line with \n newline')).toBe('Line with \\n newline');
        expect(FN('Line with , comma')).toBe('Line with \\, comma');
        expect(FN('Line with ; semicolon')).toBe('Line with \\; semicolon');
        expect(FN('Complex line with \\ and \n and , and ;')).toBe(
            'Complex line with \\\\ and \\n and \\, and \\;'
        );
    });
});
describe('extractEventBlocks()', () => {
    const FN = extractEventBlocks;

    it('extracts event blocks correctly', () => {
        const ics = `
BEGIN:VEVENT
SUMMARY:Event 1
END:VEVENT
BEGIN:VEVENT
SUMMARY:Event 2
END:VEVENT
`;
        const result = FN(ics);
        expect(result.length).toBe(2);
        expect(result[0]).toContain('Event 1');
        expect(result[1]).toContain('Event 2');
    });
    it('returns an empty array if no event blocks are found', () => {
        const ics = `
BEGIN:VCALENDAR
VERSION:2.0
END:VCALENDAR
`;
        const result = FN(ics);
        expect(result).toEqual([]);
    });
});
describe('readField()', () => {
    const FN = readField;

    it('reads the specified field from the event block', () => {
        const block = `
SUMMARY:Test Event
DESCRIPTION:This is a test event.
URL:https://example.com/event
`;
        expect(FN(block, 'SUMMARY:')).toBe('Test Event');
        expect(FN(block, 'DESCRIPTION:')).toBe('This is a test event.');
        expect(FN(block, 'URL:')).toBe('https://example.com/event');
    });
    it('returns an empty string if the field is not found', () => {
        const block = `
SUMMARY:Test Event
DESCRIPTION:This is a test event.
`;
        expect(FN(block, 'URL:')).toBe('');
    });
});
describe('readDateStart()', () => {
    const FN = readDateStart;

    it('reads the DTSTART field from the event block', () => {
        const block = `
DTSTART:20240601T120000Z
SUMMARY:Test Event
`;
        expect(FN(block)).toBe('DTSTART:20240601T120000Z');
    });
    it('returns an empty string if the DTSTART field is not found', () => {
        const block = `
SUMMARY:Test Event
`;
        expect(FN(block)).toBe('');
    });
});
    
describe('createIcsContent()', () => {
    it('creates a valid ical feed with lottery events', () => {
        const HOST = 'https://example.com';
        const ics = createIcsContent([
            {
                description: [
                    '- Partie: 1. FC Union Berlin vs. FC St. Pauli',
                    '- Aktualisiert: 16.04.2026',
                    `- Quelle: ${HOST}/article`,
                ].join('\n'),
                endsAt: '2026-03-23T09:00:00',
                startsAt: '2026-03-20T10:00:00',
                summary: '⚽️🎲 Losbuchung: FC St. Pauli',
                uid: 'abc123@eiserner-kalender',
                url: `${HOST}/article`,
            },
        ]);

        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('X-WR-CALNAME:Eiserner Kalender');
        expect(ics).toContain('X-WR-TIMEZONE:Europe/Berlin');
        expect(ics).toContain('BEGIN:VTIMEZONE');
        expect(ics).toContain('SUMMARY:⚽️🎲 Losbuchung: FC St. Pauli');
        expect(ics).toContain(
            `DESCRIPTION:- Partie: 1. FC Union Berlin vs. FC St. Pauli\\n- Aktualisiert: 16.04.2026\\n- Quelle: ${HOST}/article`,
        );
        expect(ics).toContain('DTSTART;TZID=Europe/Berlin:20260320T100000');
        expect(ics).toContain('DTEND;TZID=Europe/Berlin:20260323T090000');
        expect(ics).toContain('END:VCALENDAR');
    });
});
