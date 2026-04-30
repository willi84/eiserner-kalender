import { CLUB } from '@config/config';
import { createDescription, createEventJSON, createMatch, createSummary, createUid, formatUpdatedAt, sortEvents, toIcs, toJson } from './convert';
import type { LotteryEvent } from '@apps/lottery/lottery.d';

const HOST = 'https://example.com';
const endpoint = `${HOST}/api/news?page=`;
const EVENT_ITEMS: { [key: string]: LotteryEvent } = {
    'cologne': {
        articleUrl: `${HOST}/article-1.html`,
        updatedAt: '2026-04-16T08:30:00.000Z',
        startsAt: '2026-04-17T10:00:00',
        endsAt: '2026-04-20T09:00:00',
        type: 'losbuchung',
        opponent: '1. FC Köln',
        isHome: true,
    },
    'freiburg': {
        articleUrl: `${HOST}/article-1.html`,
        updatedAt: '2026-04-16T08:30:00.000Z',
        startsAt: '2026-03-17T10:00:00',
        endsAt: '2026-03-20T09:00:00',
        type: 'losbuchung',
        opponent: 'SC Freiburg',
        isHome: false,
    }
}
describe('createUid()', () => {
    const FN = createUid;
    it('should create a consistent UID for the same event', () => {
        const EXPECTED = '1386b6d939becaddc7e55c2795e275e83963a01d';
        expect(FN(EVENT_ITEMS['cologne'])).toEqual(EXPECTED);
    });
});
describe('formatUpdatedAt()', () => {
    const FN = formatUpdatedAt;
    it('should format a valid date string correctly', () => {
        expect(FN('2026-04-16T08:30:00.000Z')).toEqual('16.04.2026');
    });

    it('should return "unbekannt" for null input', () => {
        expect(FN(null)).toEqual('unbekannt');
    });
});
describe('createDescription()', () => {
    const FN = createDescription;
    it('should create the correct description for a lottery event', () => {
        const result = FN(EVENT_ITEMS['cologne'], CLUB);
        const EXPECTED = [
            '- Partie: 1. FC Union Berlin vs. 1. FC Köln',
            '- Aktualisiert: 16.04.2026',
            `- Quelle: ${HOST}/article-1.html`,
        ].join('\n');
        expect(result).toEqual(EXPECTED);
    });
});
describe('createSummary()', () => {
    const FN = createSummary;
    it('should create the correct summary for a losbuchung event', () => {
        expect(FN('losbuchung', '1. FC Köln')).toEqual('⚽️🎲 Losbuchung: 1. FC Köln');
    });

    it('should create the correct summary for a losgewinnerverkauf event', () => {
        expect(FN('losgewinnerverkauf', '1. FC Köln')).toEqual('⚽️🎟️ Losgewinnerverkauf: 1. FC Köln');
    });

    it('should create the correct summary for an unknown event type', () => {
        expect(FN('unknown', '1. FC Köln')).toEqual('unknown Event: 1. FC Köln');
    });
});
describe('createMatch', () => {
    const FN = createMatch;

    it('should create the correct match', () => {
        expect(FN('FCU', EVENT_ITEMS['cologne'])).toEqual(`FCU vs. 1. FC Köln`);
        expect(FN('FCU', EVENT_ITEMS['freiburg'])).toEqual(`SC Freiburg vs. FCU`);
    })
});
describe('sortEvents()', () => {
    const FN = sortEvents;
    it('sorts events based on their start date', () => {
        const INPUT = [
            EVENT_ITEMS['cologne'],
            EVENT_ITEMS['freiburg'],
        ];
        const EXPECTED = [
            EVENT_ITEMS['freiburg'],
            EVENT_ITEMS['cologne'],
        ];
        expect(FN(INPUT)).toEqual(EXPECTED);
    });
});
describe('toIcs()', () => {
    const FN = toIcs;
    it('converts lottery events into an iCalendar feed', () => {
        const INPUT = {
            source: {
                searchTerms: [ 'losverfahren', 'lostermine', 'losbuchung' ],
                endpoint,
                updatedAt: '2026-04-16T08:30:00.000Z'
            },
            termine: [
                EVENT_ITEMS['cologne']
            ],
            verein: CLUB
        }
        const result = FN(INPUT);
        const currentTime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const EXPECTED = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Eiserner Kalender//Lottery//DE',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:Eiserner Kalender',
            'X-WR-TIMEZONE:Europe/Berlin',
            'BEGIN:VEVENT',
            'UID:1386b6d939becaddc7e55c2795e275e83963a01d@eiserner-kalender',
            `DTSTAMP:${currentTime}`,
            'DTSTART:20260417T080000Z',
            'DTEND:20260420T070000Z',
            'SUMMARY:⚽️🎲 Losbuchung: 1. FC Köln',
            'DESCRIPTION:- Partie: 1. FC Union Berlin vs. 1. FC Köln\\n- Aktualisiert: 16.04.2026\\n- Quelle: https://example.com/article-1.html',
            `URL:${HOST}/article-1.html`,
            'END:VEVENT',
            'END:VCALENDAR',
            '',
        ].join('\r\n');
        expect(result).toEqual(EXPECTED);
    });

    it('returns a valid iCalendar feed with no events', () => {
        const INPUT = {
            source: {
                searchTerms: [ 'losverfahren', 'lostermine', 'losbuchung' ],
                endpoint,
                updatedAt: '2026-04-16T08:30:00.000Z'
            },
            termine: [],
            verein: CLUB
        };

        const result = FN(INPUT);
        const EXPECTED = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Eiserner Kalender//Lottery//DE',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:Eiserner Kalender',
            'X-WR-TIMEZONE:Europe/Berlin',
            'END:VCALENDAR',
            '',
        ].join('\r\n');
        expect(result).toEqual(EXPECTED);
    });
});
describe('toJson()', () => {
    const FN = toJson;
    it('creates a JSON feed from lottery article payloads and source information', () => {
        const INPUT = {
            source: {
                searchTerms: [ 'losverfahren', 'lostermine', 'losbuchung' ],
                endpoint,
                updatedAt: '2026-04-16T08:30:00.000Z'
            },
            termine: [
                EVENT_ITEMS['cologne'],
                EVENT_ITEMS['freiburg'],
            ],
            verein: '1. FC Union Berlin'
        }

        const result = FN(INPUT);
        const EXPECTED = {
            source: {
                searchTerms: [ 'losverfahren', 'lostermine', 'losbuchung' ],
                endpoint,
                updatedAt: '2026-04-16T08:30:00.000Z'
            },
            termine: [
                {
                    ...EVENT_ITEMS['freiburg'],
                    partie: 'SC Freiburg vs. 1. FC Union Berlin',
                    summary: '⚽️🎲 Losbuchung: SC Freiburg'
                },
                {
                    ...EVENT_ITEMS['cologne'],
                    partie: '1. FC Union Berlin vs. 1. FC Köln',
                    summary: '⚽️🎲 Losbuchung: 1. FC Köln'
                },
            ],
            verein: '1. FC Union Berlin'
        };
        expect(result).toEqual(EXPECTED);
    });
});
describe('createEventJSON()', () => {
    const FN = createEventJSON;
    it('creates a JSON feed from lottery article payloads and source information', () => {
        const articlePayloads = [
            [
                {
                    articleUrl: `${HOST}/article-1.html`,
                    opponent: '1. FC Köln',
                    isHome: true,
                    updatedAt: '2026-04-16T08:30:00.000Z',
                    events: [
                        {
                            type: 'losbuchung',
                            startsAt: '2026-04-17T10:00:00',
                            endsAt: '2026-04-20T09:00:00',
                        }
                    ],
                },
            ],
        ];
        const source = {
            searchTerms: ['losverfahren', 'lostermine', 'losbuchung'],
            endpoint: `${HOST}/api/news?page=`,
            updatedAt: '2026-04-16T08:30:00.000Z',
        };
        const result = FN(articlePayloads, source);
        const EXPECTED = {
            source: {
                searchTerms: [ 'losverfahren', 'lostermine', 'losbuchung' ],
                endpoint: `${HOST}/api/news?page=`,
                updatedAt: '2026-04-16T08:30:00.000Z'
            },
            termine: [
                EVENT_ITEMS['cologne'],
            ],
            verein: '1. FC Union Berlin'
        };
        expect(result).toEqual(EXPECTED);
    });
});
