import { parseGermanDateLine, parseLotteryArticle } from './parser';

describe('parseGermanDateLine()', () => {
    const FN = parseGermanDateLine;

    it('should correctly parse a valid date line (v1)', () => {
        const line = 'Fr | 17.04.2026 | 10 Uhr bis Mo | 20.04.2026 | 09 Uhr';
        expect(FN(line)).toEqual({
            startsAt: '2026-04-17T10:00:00',
            endsAt: '2026-04-20T09:00:00',
        });
    });
    it('should correctly parse a valid date line (v2)', () => {
        const line = '20.03.2026 10:00 - 23.03.2026 09:00';
        expect(FN(line)).toEqual({
            startsAt: '2026-03-20T10:00:00',
            endsAt: '2026-03-23T09:00:00',
        });
    });
    it('should correctly parse a valid date line (v3)', () => {
        const line = '20.03.2026 | 10:00 Uhr bis 23.03.2026 | 09:00 Uhr';
        expect(FN(line)).toEqual({
            startsAt: '2026-03-20T10:00:00',
            endsAt: '2026-03-23T09:00:00',
        });
    });
    it('should return null for an invalid date line', () => {
        const line = 'This is not a valid date line';
        expect(FN(line)).toBeNull();
    });
    
});

describe('parseLotteryArticle()', () => {
    const FN = parseLotteryArticle;

    it('should return an empty array if no parties are found', () => {
        const html = `
            <article>
                <p>Some random content without parties.</p>
            </article>
        `;

        expect(FN('https://example.com/article', html)).toEqual([]);
    });
    
    it('should return parsed lottery article data with events for HOME', () => {
        const html = `
            <article>
                <time datetime="2026-04-10">April 10, 2026</time>
                <p>1. FC Union Berlin vs. 1. FC Köln</p>
                <p>Losbuchung</p>
                <p>20.03.2026 10:00 - 23.03.2026 09:00</p>
                <p>Losgewinner</p>
                <p>24.03.2026 10:00 - 27.03.2026 09:00</p>
            </article>
        `;

        expect(FN('https://example.com/article', html)).toEqual([
            {
                articleUrl: 'https://example.com/article',
                events: [
                    {
                        endsAt: '2026-03-23T09:00:00',
                        startsAt: '2026-03-20T10:00:00',
                        type: 'losbuchung',
                    },
                    {
                        endsAt: '2026-03-27T09:00:00',
                        startsAt: '2026-03-24T10:00:00',
                        type: 'losgewinnerverkauf',
                    },
                ],
                isHome: true,
                opponent: '1. FC Köln',
                updatedAt: '2026-04-10',
            },
        ]);
    });
    it('should return parsed lottery article data with events for AWAY', () => {
        const html = `
            <article>
                <time datetime="2026-04-10">April 10, 2026</time>
                <p>1. FC Köln vs. 1. FC Union Berlin</p>
                <p>Losbuchung</p>
                <p>20.03.2026 10:00 - 23.03.2026 09:00</p>
                <p>Losgewinner</p>
                <p>24.03.2026 10:00 - 27.03.2026 09:00</p>
            </article>
        `;


        expect(FN('https://example.com/article', html)).toEqual([
            {
                articleUrl: 'https://example.com/article',
                events: [
                    {
                        endsAt: '2026-03-23T09:00:00',
                        startsAt: '2026-03-20T10:00:00',
                        type: 'losbuchung',
                    },
                    {
                        endsAt: '2026-03-27T09:00:00',
                        startsAt: '2026-03-24T10:00:00',
                        type: 'losgewinnerverkauf',
                    },
                ],
                isHome: false,
                opponent: '1. FC Köln',
                updatedAt: '2026-04-10',
            },
        ]);
    });
});