import { getNewsUrls, getSearchArticleUrls, getSearchPages } from './news';
import { FS } from '@_shared/fs/fs';
import { ENDPOINT } from '@config/endpoint';
import * as FETCH from '@_shared/fetch/fetch';
import { LOG } from '@_shared/log/log';
const path = require('node:path');
const SAMPLE_RESPONSE = FS.readFile(path.join(__dirname, 'news-sample.json')) || '{}';
const SAMPLE_JSON = JSON.parse(SAMPLE_RESPONSE);

describe('getNewsUrls()', () => {
    const FN = getNewsUrls;
    
    it('returns an empty array if the response does not contain any news items', () => {
        const searchTerms = ['foo', 'bar'];
        const response = JSON.stringify({ data: {} });
        const result = FN(searchTerms, JSON.parse(response));
        expect(result).toEqual([]);
    });

    it('returns the correct news URLs for matching search terms', () => {
        const searchTerms = ['losverfahren', 'losbuchung'];
        const result = FN(searchTerms, SAMPLE_JSON);
        expect(result).toEqual([
            '/de/meldungen/losverfahren-zu-den-heimspielen-gegen-koeln-und-augsburg-PcNWYI',
            '/de/meldungen/losbuchung-zu-den-heimspielen',
        ]);
    });
});
describe('getSearchPages()', () => {
    const FN = getSearchPages;

    it('returns an array of page numbers up to the total pages or limit', () => {
        expect(FN(3)).toEqual([1, 2, 3]);
        expect(FN(5, 10)).toEqual([1, 2, 3, 4, 5]);
        expect(FN(15, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(FN(0, 10)).toEqual([1]);
    });
});
describe('getSearchArticleUrls()', () => {
    const FN = getSearchArticleUrls;
    let commandSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;
    const SEARCH_TERMS = ['losverfahren', 'losbuchung'];
    const NEWS_SAMPLES = [
        { headline: 'Losverfahren zu den Heimspielen gegen Köln und Augsburg', detailLink: '/news/1' },
        { headline: 'Ein anderes Thema', detailLink: '/news/2' },
        { headline: 'Losbuchung zu den Heimspielen', detailLink: '/news/3' },
        { headline: 'Noch ein Thema', detailLink: '/news/4' },
    ]
    beforeEach(() => {
        warnSpy = jest.spyOn(LOG, 'WARN');
        commandSpy = jest.spyOn(FETCH, 'getJSON').mockImplementation((request: string) => {
            if(request.includes('example.com')) {
                if (request.includes('page=1')) {
                    return {
                        data: {
                            news: [ NEWS_SAMPLES[0], NEWS_SAMPLES[1] ],
                            totalPages: 2,
                        },
                    };
                } else if (request.includes('page=2')) {
                    return {
                        data: {
                            news: [ NEWS_SAMPLES[2], NEWS_SAMPLES[3] ],
                            totalPages: 2,
                        },
                    };
                }
            
            } else if(request.includes('invalid.com')) {
                return {
                    data: {
                        news: [],
                        totalPages: 2,
                    },
                };
            } else {
                return {
                    data: {
                        news: [],
                        totalPages: 0,
                    },
                };
            }
        });
    });
    afterEach(() => {
        warnSpy.mockRestore();
        commandSpy.mockRestore();
    });

    it('returns an array of unique article URLs matching the search terms across paginated responses', () => {
        const HOST: string = 'https://example.com';
        const endpoint: ENDPOINT = { url: `${HOST}/api/news?page=`, host: HOST };
        
        // Mock getJSON to return the corresponding mock response based on the page number
        const result = FN(SEARCH_TERMS, endpoint);
        expect(result).toEqual([
            `${HOST}/news/1`,
            `${HOST}/news/3`,
        ]);
        // Restore original getJSON function
    });
    it('stops fetching more pages if the requested page exceeds totalPages', () => {
        const HOST: string = 'https://empty.com';
        const endpoint: ENDPOINT = { url: `${HOST}/api/news?page=`, host: HOST };
        
        const result = FN(SEARCH_TERMS, endpoint);
        expect(result).toEqual([ ]);
        expect(warnSpy).toHaveBeenCalledWith('Seite 1 existiert nicht (nur 0 Seiten insgesamt), überspringe weitere Anfragen...');
    });
    it('handles empty array ', () => {
        const HOST: string = 'https://invalid.com';
        const endpoint: ENDPOINT = { url: `${HOST}/api/news?page=`, host: HOST };
        
        const result = FN(SEARCH_TERMS, endpoint);
        expect(result).toEqual([ ]);
    })
});