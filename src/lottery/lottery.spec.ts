import { createLotteryIcs } from './ical/ical';
import { extractArticleUrlsFromSearchResponse, parseLotteryArticle } from './parser/parser';

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
                ],
            },
        });

        expect(extractArticleUrlsFromSearchResponse(response)).toEqual([
            'https://www.fc-union-berlin.de/de/meldungen/losverfahren-zu-den-heimspielen-gegen-koeln-und-augsburg-PcNWYI',
            'https://www.fc-union-berlin.de/de/meldungen/losverfahren-startet-am-19-februar-RgeVAU',
        ]);
    });

    it('parses multiple lottery windows from an article', () => {
        const articleHtml = `
            <article>
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

describe('createLotteryIcs()', () => {
    it('creates a valid ical feed with lottery events', () => {
        const ics = createLotteryIcs([
            {
                description: 'Quelle: https://example.com/article',
                endsAt: '2026-03-23T09:00:00',
                startsAt: '2026-03-20T10:00:00',
                summary: '⚽️🎲 Losbuchung: FC St. Pauli',
                uid: 'abc123@eiserner-kalender',
                url: 'https://example.com/article',
            },
        ]);

        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('SUMMARY:⚽️🎲 Losbuchung: FC St. Pauli');
        expect(ics).toContain('DTSTART:20260320T100000');
        expect(ics).toContain('DTEND:20260323T090000');
        expect(ics).toContain('END:VCALENDAR');
    });
});
