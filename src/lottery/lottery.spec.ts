import type { Spiel } from '../events/events';
import { createLotteryIcs } from './ical/ical';
import { createLotteryCalendarDebugReport } from './lottery';
import {
    extractArticleUrlsFromSearchResponse,
    extractTotalPagesFromSearchResponse,
    parseLotteryArticle,
} from './parser/parser';

describe('lottery parser', () => {
    it('extracts article links from the search endpoint response', () => {
        const response = JSON.stringify({
            data: {
                news: [
                    {
                        headline: 'Losverfahren zu den Heimspielen gegen Köln und Augsburg',
                        detailLink: '/de/meldungen/losverfahren-zu-den-heimspielen-gegen-koeln-und-augsburg-PcNWYI',
                    },
                    {
                        headline: 'Traditionself startet in die Sommertour 2026',
                        detailLink: '/de/meldungen/traditionself-startet-in-die-sommertour-2026-VZXw4X',
                    },
                    {
                        headline: 'Losverfahren startet am 19. Februar',
                        detailLink: '/de/meldungen/losverfahren-startet-am-19-februar-RgeVAU',
                    },
                    {
                        headline: 'Lostermine fuer das Heimspiel gegen Bremen',
                        detailLink: '/de/meldungen/lostermine-fuer-das-heimspiel-gegen-bremen-ABCD12',
                    },
                    {
                        headline: 'Losbuchungen fuer Mitglieder gestartet',
                        detailLink: '/de/meldungen/losbuchungen-fuer-mitglieder-gestartet-EFGH34',
                    },
                ],
            },
        });

        expect(
            extractArticleUrlsFromSearchResponse(response, ['losverfahren', 'lostermine', 'losbuchungen']),
        ).toEqual([
            'https://www.fc-union-berlin.de/de/meldungen/losverfahren-zu-den-heimspielen-gegen-koeln-und-augsburg-PcNWYI',
            'https://www.fc-union-berlin.de/de/meldungen/losverfahren-startet-am-19-februar-RgeVAU',
            'https://www.fc-union-berlin.de/de/meldungen/lostermine-fuer-das-heimspiel-gegen-bremen-ABCD12',
            'https://www.fc-union-berlin.de/de/meldungen/losbuchungen-fuer-mitglieder-gestartet-EFGH34',
        ]);
    });

    it('extracts the total page count from the search endpoint response', () => {
        const response = JSON.stringify({
            data: {
                totalPages: 809,
            },
        });

        expect(extractTotalPagesFromSearchResponse(response)).toBe(809);
    });

    it('normalizes opponent aliases from lottery articles to the canonical team name', () => {
        const articleHtml = `
            <article>
                <div class="richtext-table">
                    <p><strong>1. FC Union Berlin vs. 1. FC Koeln</strong></p>
                    <ul>
                        <li>
                            <p><strong>Losbuchung</strong><br>Fr | 20.03.2026 | 10 Uhr bis Mo | 23.03.2026 | 09 Uhr</p>
                        </li>
                    </ul>
                </div>
            </article>
        `;

        expect(parseLotteryArticle('https://example.com/article', articleHtml)).toEqual([
            {
                articleUrl: 'https://example.com/article',
                opponent: '1. FC Köln',
                partie: '1. FC Union Berlin vs. 1. FC Koeln',
                updatedAt: null,
                events: [
                    {
                        type: 'losbuchung',
                        startsAt: '2026-03-20T10:00:00',
                        endsAt: '2026-03-23T09:00:00',
                        summary: '⚽️🎲 Losbuchung: 1. FC Köln',
                    },
                ],
            },
        ]);
    });

    it('normalizes additional second division aliases from lottery articles', () => {
        const articleHtml = `
            <article>
                <div class="richtext-table">
                    <p><strong>1. FC Union Berlin vs. Hertha Berlin</strong></p>
                    <ul>
                        <li>
                            <p><strong>Losbuchung</strong><br>Fr | 20.03.2026 | 10 Uhr bis Mo | 23.03.2026 | 09 Uhr</p>
                        </li>
                    </ul>
                </div>
            </article>
        `;

        expect(parseLotteryArticle('https://example.com/article', articleHtml)).toEqual([
            {
                articleUrl: 'https://example.com/article',
                opponent: 'Hertha BSC',
                partie: '1. FC Union Berlin vs. Hertha Berlin',
                updatedAt: null,
                events: [
                    {
                        type: 'losbuchung',
                        startsAt: '2026-03-20T10:00:00',
                        endsAt: '2026-03-23T09:00:00',
                        summary: '⚽️🎲 Losbuchung: Hertha BSC',
                    },
                ],
            },
        ]);
    });

    it('parses multiple lottery windows from an article', () => {
        const articleHtml = `
            <article>
                <header>
                    <time datetime="2026-04-16T08:30:00.000Z">16. April 2026</time>
                </header>
                <div class="richtext-table">
                    <p><strong>1. FC Union Berlin vs. FC St. Pauli</strong></p>
                    <ul>
                        <li>
                            <p><strong>Losbuchung</strong><br>Fr | 20.03.2026 | 10 Uhr bis Mo | 23.03.2026 | 09 Uhr</p>
                        </li>
                        <li>
                            <p><strong>Platzkarte Losgewinner</strong><br>Mi | 25.03.2026 | 10 Uhr bis Do | 26.03.2026 | 17 Uhr</p>
                        </li>
                    </ul>
                    <p><strong>1. FC Union Berlin vs.VfL Wolfsburg</strong></p>
                    <ul>
                        <li>
                            <p><strong>Losbuchung</strong><br>Do | 02.04.2026 | 10 Uhr bis Di | 07.04.2026 | 09 Uhr</p>
                        </li>
                        <li>
                            <p><strong>Platzkarte Losgewinner</strong><br>Mi | 08.04.2026 | 10 Uhr bis Do | 09.04.2026 | 17 Uhr</p>
                        </li>
                    </ul>
                </div>
            </article>
        `;

        expect(parseLotteryArticle('https://example.com/article', articleHtml)).toEqual([
            {
                articleUrl: 'https://example.com/article',
                opponent: 'FC St. Pauli',
                partie: '1. FC Union Berlin vs. FC St. Pauli',
                updatedAt: '2026-04-16T08:30:00.000Z',
                events: [
                    {
                        type: 'losbuchung',
                        startsAt: '2026-03-20T10:00:00',
                        endsAt: '2026-03-23T09:00:00',
                        summary: '⚽️🎲 Losbuchung: FC St. Pauli',
                    },
                    {
                        type: 'losgewinnerverkauf',
                        startsAt: '2026-03-25T10:00:00',
                        endsAt: '2026-03-26T17:00:00',
                        summary: '⚽️ Verkauf Losgewinner: FC St. Pauli',
                    },
                ],
            },
            {
                articleUrl: 'https://example.com/article',
                opponent: 'VfL Wolfsburg',
                partie: '1. FC Union Berlin vs.VfL Wolfsburg',
                updatedAt: '2026-04-16T08:30:00.000Z',
                events: [
                    {
                        type: 'losbuchung',
                        startsAt: '2026-04-02T10:00:00',
                        endsAt: '2026-04-07T09:00:00',
                        summary: '⚽️🎲 Losbuchung: VfL Wolfsburg',
                    },
                    {
                        type: 'losgewinnerverkauf',
                        startsAt: '2026-04-08T10:00:00',
                        endsAt: '2026-04-09T17:00:00',
                        summary: '⚽️ Verkauf Losgewinner: VfL Wolfsburg',
                    },
                ],
            },
        ]);
    });
});

describe('createLotteryCalendarDebugReport()', () => {
    it('compares lottery opponents against home games from the calendar', () => {
        const calendarGames: Spiel[] = [
            {
                anstoss: '2026-03-20T15:30:00+01:00',
                datum: '2026-03-20',
                gegner: 'FC St. Pauli',
                isoWeekYear: 2026,
                kalenderwoche: 12,
                spielort: 'heim',
            },
            {
                anstoss: '2026-04-08T15:30:00+01:00',
                datum: '2026-04-08',
                gegner: 'VfL Wolfsburg',
                isoWeekYear: 2026,
                kalenderwoche: 15,
                spielort: 'heim',
            },
            {
                anstoss: '2026-04-20T15:30:00+01:00',
                datum: '2026-04-20',
                gegner: '1. FC Köln',
                isoWeekYear: 2026,
                kalenderwoche: 17,
                spielort: 'heim',
            },
        ];
        const searchTerms = ['losverfahren', 'lostermine'];

        expect(
            createLotteryCalendarDebugReport(
                calendarGames,
                [
                    {
                        articleUrl: 'https://example.com/article-1',
                        endsAt: '2026-03-23T09:00:00',
                        opponent: 'FC St. Pauli',
                        partie: '1. FC Union Berlin vs. FC St. Pauli',
                        startsAt: '2026-03-20T10:00:00',
                        summary: '⚽️🎲 Losbuchung: FC St. Pauli',
                        type: 'losbuchung',
                        updatedAt: '2026-04-16T08:30:00.000Z',
                    },
                    {
                        articleUrl: 'https://example.com/article-2',
                        endsAt: '2026-04-09T17:00:00',
                        opponent: 'VfL Wolfsburg',
                        partie: '1. FC Union Berlin vs. VfL Wolfsburg',
                        startsAt: '2026-04-08T10:00:00',
                        summary: '⚽️ Verkauf Losgewinner: VfL Wolfsburg',
                        type: 'losgewinnerverkauf',
                        updatedAt: '2026-04-16T08:30:00.000Z',
                    },
                    {
                        articleUrl: 'https://example.com/article-3',
                        endsAt: '2026-04-10T17:00:00',
                        opponent: '1. FC Koeln',
                        partie: '1. FC Union Berlin vs. 1. FC Koeln',
                        startsAt: '2026-04-09T10:00:00',
                        summary: '⚽️🎲 Losbuchung: 1. FC Koeln',
                        type: 'losbuchung',
                        updatedAt: '2026-04-16T08:30:00.000Z',
                    },
                    {
                        articleUrl: 'https://example.com/article-4',
                        endsAt: '2026-05-10T17:00:00',
                        opponent: 'RB Leipzig',
                        partie: '1. FC Union Berlin vs. RB Leipzig',
                        startsAt: '2026-05-09T10:00:00',
                        summary: '⚽️🎲 Losbuchung: RB Leipzig',
                        type: 'losbuchung',
                        updatedAt: '2026-04-16T08:30:00.000Z',
                    },
                ],
                searchTerms,
            ),
        ).toEqual({
            calendarGameCount: 3,
            missingCalendarGames: [],
            recognizedCalendarGameCount: 3,
            recognizedCalendarGames: ['1. FC Köln', 'FC St. Pauli', 'VfL Wolfsburg'],
            searchTerms,
            unmatchedLotteryGames: ['RB Leipzig'],
        });
    });
});

describe('createLotteryIcs()', () => {
    it('creates a valid ical feed with lottery events', () => {
        const ics = createLotteryIcs([
            {
                description: [
                    '- Partie: 1. FC Union Berlin vs. FC St. Pauli',
                    '- Aktualisiert: 16.04.2026',
                    '- Quelle: https://example.com/article',
                ].join('\n'),
                endsAt: '2026-03-23T09:00:00',
                startsAt: '2026-03-20T10:00:00',
                summary: '⚽️🎲 Losbuchung: FC St. Pauli',
                uid: 'abc123@eiserner-kalender',
                url: 'https://example.com/article',
            },
        ]);

        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('SUMMARY:⚽️🎲 Losbuchung: FC St. Pauli');
        expect(ics).toContain(
            'DESCRIPTION:- Partie: 1. FC Union Berlin vs. FC St. Pauli\\n- Aktualisiert: 16.04.2026\\n- Quelle: https://example.com/article',
        );
        expect(ics).toContain('DTSTART:20260320T100000');
        expect(ics).toContain('DTEND:20260323T090000');
        expect(ics).toContain('END:VCALENDAR');
    });
});
