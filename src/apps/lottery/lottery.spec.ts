import type { Spiel } from '@component/calendar/events/events.d';
import { createLotteryCalendarDebugReport, getEventItemsFromEndpoints } from './lottery';
import * as FETCH from '@_shared/fetch/fetch';
import {
    parseLotteryArticle,
} from '../../lottery/parser/parser';
import { getNewsUrls } from '@component/news/news';
import type{ NewsResponse } from '@component/news/news.d';
import { FS } from '@_shared/fs/fs';
import { ENDPOINT } from '@config/endpoint';

describe('lottery parser', () => {
    it('extracts article links from the search endpoint response', () => {
        const response: NewsResponse = {
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
                        headline: 'Lostermine fuer das Heimspiel gegen Bremen',
                        detailLink: '/de/meldungen/lostermine-fuer-das-heimspiel-gegen-bremen-ABCD12',
                    },
                    {
                        headline: 'Losbuchungen fuer Mitglieder gestartet',
                        detailLink: '/de/meldungen/losbuchungen-fuer-mitglieder-gestartet-EFGH34',
                    },
                ],
            },
        };

        expect(
            getNewsUrls(['losverfahren', 'lostermine', 'losbuchungen'], response),
        ).toEqual([
            '/de/meldungen/losverfahren-zu-den-heimspielen-gegen-koeln-und-augsburg-PcNWYI',
            '/de/meldungen/lostermine-fuer-das-heimspiel-gegen-bremen-ABCD12',
            '/de/meldungen/losbuchungen-fuer-mitglieder-gestartet-EFGH34',
        ]);
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
                isHome: true,
                updatedAt: null,
                events: [
                    {
                        type: 'losbuchung',
                        startsAt: '2026-03-20T10:00:00',
                        endsAt: '2026-03-23T09:00:00',
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
                isHome: true,
                updatedAt: null,
                events: [
                    {
                        type: 'losbuchung',
                        startsAt: '2026-03-20T10:00:00',
                        endsAt: '2026-03-23T09:00:00',
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
                    <p><strong>VfL Wolfsburg vs. 1. FC Union Berlin</strong></p>
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
                isHome: true,
                updatedAt: '2026-04-16T08:30:00.000Z',
                events: [
                    {
                        type: 'losbuchung',
                        startsAt: '2026-03-20T10:00:00',
                        endsAt: '2026-03-23T09:00:00',
                    },
                    {
                        type: 'losgewinnerverkauf',
                        startsAt: '2026-03-25T10:00:00',
                        endsAt: '2026-03-26T17:00:00',
                    },
                ],
            },
            {
                articleUrl: 'https://example.com/article',
                opponent: 'VfL Wolfsburg',
                isHome: false,
                updatedAt: '2026-04-16T08:30:00.000Z',
                events: [
                    {
                        type: 'losbuchung',
                        startsAt: '2026-04-02T10:00:00',
                        endsAt: '2026-04-07T09:00:00',
                    },
                    {
                        type: 'losgewinnerverkauf',
                        startsAt: '2026-04-08T10:00:00',
                        endsAt: '2026-04-09T17:00:00',
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
                        // partie: '1. FC Union Berlin vs. FC St. Pauli',
                        startsAt: '2026-03-20T10:00:00',
                        // summary: '⚽️🎲 Losbuchung: FC St. Pauli',
                        isHome: true,
                        type: 'losbuchung',
                        updatedAt: '2026-04-16T08:30:00.000Z',
                    },
                    {
                        articleUrl: 'https://example.com/article-2',
                        endsAt: '2026-04-09T17:00:00',
                        opponent: 'VfL Wolfsburg',
                        startsAt: '2026-04-08T10:00:00',
                        isHome: true,
                        type: 'losgewinnerverkauf',
                        updatedAt: '2026-04-16T08:30:00.000Z',
                    },
                    {
                        articleUrl: 'https://example.com/article-3',
                        endsAt: '2026-04-10T17:00:00',
                        opponent: '1. FC Koeln',
                        startsAt: '2026-04-09T10:00:00',
                        isHome: true,
                        type: 'losbuchung',
                        updatedAt: '2026-04-16T08:30:00.000Z',
                    },
                    {
                        articleUrl: 'https://example.com/article-4',
                        endsAt: '2026-05-10T17:00:00',
                        opponent: 'RB Leipzig',
                        startsAt: '2026-05-09T10:00:00',
                        isHome: true,
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
describe('getEventItemsFromEndpoints()', () => {
    const FN = getEventItemsFromEndpoints;
    let commandSpy: jest.SpyInstance;
    const CWD = process.cwd();
    const endpoint: ENDPOINT = {
        host: 'https://example.com',
        url: 'https://example.com/api/news?page=',
    };
    const searchTerms = [
        'losverfahren',
        'lostermin',
        'lostermine',
        'losbuchung',
        'losbuchungen',
        'losverkauf',
        'losgewinner',
    ];
    beforeEach(() => {
        commandSpy = jest.spyOn(FETCH, 'fetchTextSync').mockImplementation((request: string): string => {
            let result: string = '';
            if(request.indexOf('api/news') !== -1) {
                const json = {
                    data: {
                        news: [
                            {
                                headline: 'Losbuchung zu den Heimspielen gegen Köln und Augsburg',
                                detailLink: '/article-1.html',
                            },
                        ],
                        totalPages: 1,
                    },
                };
                result = JSON.stringify(json);
            } else if(request.indexOf('article-') !== -1) {

                const file = request.replace(endpoint.host, '');
                result = FS.readFile(`${CWD}/src/samples${file}`) || '';
            }
            return result;
        });
    });
    afterEach(() => {
        commandSpy.mockRestore();
    });
    it('fetches article HTML from the specified endpoints and parses lottery events', () => {
        const updatedAt = '2026-04-16T08:30:00.000Z';
        const endpoints = [
            {
                searchTerms,
                endpoint,
                updatedAt,
            },
            {
                searchTerms,

                endpoint,
                updatedAt,
            },
        ];

        const result = FN(endpoints[0].endpoint, endpoints[0].searchTerms);
        const EXPECTED = [
        [
            {
            opponent: '1. FC Köln',
            articleUrl: 'https://example.com/article-1.html',
            isHome: true,
            updatedAt,
            events: [
                {
                    type: 'losbuchung',
                    startsAt: '2026-04-17T10:00:00',
                    endsAt: '2026-04-20T09:00:00'
                },
                {
                    type: 'losgewinnerverkauf',
                    startsAt: '2026-04-22T10:00:00',
                    endsAt: '2026-04-23T17:00:00'
                }
            ]
            },
            {
            opponent: 'FC Augsburg',
            articleUrl: 'https://example.com/article-1.html',
            isHome: true,
            updatedAt,
            events: [
                {
                    type: 'losbuchung',
                    startsAt: '2026-04-30T10:00:00',
                    endsAt: '2026-05-04T09:00:00'
                },
                {
                    type: 'losgewinnerverkauf',
                    startsAt: '2026-05-06T10:00:00',
                    endsAt: '2026-05-07T17:00:00'
                }
            ]
            }
        ],
        ];
        expect(result).toEqual(EXPECTED);
    });
});
