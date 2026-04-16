import { createHash } from 'node:crypto';
import { command } from '../cmd/cmd';
import { createLotteryIcs } from './ical/ical';
import { extractArticleUrlsFromSearchResponse, parseLotteryArticle } from './parser/parser';

type LotteryEventType = 'losbuchung' | 'losgewinnerverkauf';

type LotteryEvent = {
    articleUrl: string;
    endsAt: string;
    opponent: string;
    startsAt: string;
    summary: string;
    type: LotteryEventType;
};

type LotteryExport = {
    abgerufenAm: string;
    fansNewsUrl: string;
    ics: string;
    json: string;
};

type LotteryFeed = {
    quelle: {
        abgerufenAm: string;
        fansNewsUrl: string;
        searchTerm: string;
    };
    termine: LotteryEvent[];
    verein: string;
};

const CLUB = '1. FC Union Berlin';
const SEARCH_TERM = 'losverfahren';
const SEARCH_PAGE_LIMIT = 10;
const SEARCH_ENDPOINT = 'https://www.fc-union-berlin.de/api/v1/de/news/search?page=1';

const escapeShellArg = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`;

const fetchTextSync = (url: string) => {
    const response = command(`curl -sL ${escapeShellArg(url)}`);

    if (!response.trim()) {
        throw new Error(`Request failed for ${url}`);
    }

    return response;
};

const createSearchUrl = (page: number) => {
    const url = new URL(SEARCH_ENDPOINT);
    url.searchParams.set('page', String(page));
    return url.toString();
};

const getSearchArticleUrls = () => {
    const articleUrls: string[] = [];

    for (let page = 1; page <= SEARCH_PAGE_LIMIT; page += 1) {
        const searchResponse = fetchTextSync(createSearchUrl(page));
        const pageArticleUrls = extractArticleUrlsFromSearchResponse(searchResponse);

        if (pageArticleUrls.length === 0) {
            continue;
        }

        articleUrls.push(...pageArticleUrls);
    }

    return Array.from(new Set(articleUrls));
};

const sortEvents = (events: LotteryEvent[]) => {
    return [...events].sort((left, right) => left.startsAt.localeCompare(right.startsAt));
};

const createUid = (event: LotteryEvent) => {
    return createHash('sha1')
        .update(`${event.type}|${event.opponent}|${event.startsAt}|${event.articleUrl}`)
        .digest('hex');
};

const toFeed = (fansNewsUrl: string, abgerufenAm: string, events: LotteryEvent[]): LotteryFeed => {
    return {
        quelle: {
            abgerufenAm,
            fansNewsUrl,
            searchTerm: SEARCH_TERM,
        },
        termine: sortEvents(events),
        verein: CLUB,
    };
};

const toIcs = (events: LotteryEvent[]) => {
    return createLotteryIcs(
        sortEvents(events).map((event) => ({
            description: `${event.summary}\nQuelle: ${event.articleUrl}`,
            endsAt: event.endsAt,
            startsAt: event.startsAt,
            summary: event.summary,
            uid: `${createUid(event)}@eiserner-kalender`,
            url: event.articleUrl,
        })),
    );
};

export const createLotteryExport = (): LotteryExport => {
    const articleUrls = getSearchArticleUrls();
    const articlePayloads = articleUrls.map((articleUrl) => {
        const articleHtml = fetchTextSync(articleUrl);
        return parseLotteryArticle(articleUrl, articleHtml);
    });
    const events = articlePayloads
        .flat()
        .flatMap((article) =>
            article.events.map((event) => ({
                articleUrl: article.articleUrl,
                endsAt: event.endsAt,
                opponent: article.opponent,
                startsAt: event.startsAt,
                summary: event.summary,
                type: event.type,
            })),
        );
    const abgerufenAm = new Date().toISOString().slice(0, 10);
    const feed = toFeed(SEARCH_ENDPOINT, abgerufenAm, events);

    return {
        abgerufenAm,
        fansNewsUrl: SEARCH_ENDPOINT,
        ics: toIcs(feed.termine),
        json: JSON.stringify(feed, null, 2),
    };
};
