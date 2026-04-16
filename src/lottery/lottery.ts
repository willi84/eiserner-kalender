import { createHash } from 'node:crypto';
import type { Spiel } from '../events/events';
import { command } from '../cmd/cmd';
import { TEXT_RECOGNITION_SYNONYMS } from '../config/text-recognition-synonyms';
import { getCanonicalTeamName, normalizeTeamValue } from '../teams/team-synonyms/team-synonyms';
import { createLotteryIcs } from './ical/ical';
import {
    extractArticleUrlsFromSearchResponse,
    extractTotalPagesFromSearchResponse,
    parseLotteryArticle,
} from './parser/parser';

type LotteryEventType = 'losbuchung' | 'losgewinnerverkauf';

type LotteryEvent = {
    articleUrl: string;
    endsAt: string;
    opponent: string;
    partie: string;
    startsAt: string;
    summary: string;
    type: LotteryEventType;
    updatedAt: string | null;
};

export type LotteryCalendarDebugReport = {
    calendarGameCount: number;
    missingCalendarGames: string[];
    recognizedCalendarGameCount: number;
    recognizedCalendarGames: string[];
    searchTerms: string[];
    unmatchedLotteryGames: string[];
};

export type LotteryExport = {
    abgerufenAm: string;
    debug: LotteryCalendarDebugReport;
    fansNewsUrl: string;
    ics: string;
    json: string;
};

type LotteryFeed = {
    quelle: {
        abgerufenAm: string;
        fansNewsUrl: string;
        searchTerms: string[];
    };
    termine: LotteryEvent[];
    verein: string;
};

const CLUB = '1. FC Union Berlin';
const DEFAULT_SEARCH_TERMS = [...TEXT_RECOGNITION_SYNONYMS.lottery];
const SEARCH_PAGE_LIMIT = 50;
const SEARCH_ENDPOINT = 'https://www.fc-union-berlin.de/api/v1/de/news/search?page=1';

const escapeShellArg = (value: string) => `'${value.replace(/'/g, `"'"'`)}'`;

const fetchTextSync = (url: string) => {
    const response = command(`curl -sL ${escapeShellArg(url)}`);

    if (!response.trim()) {
        throw new Error(`Request failed for ${url}`);
    }

    return response;
};

const getSearchTerms = () => {
    const configuredTerms = process.env.LOTTERY_SEARCH_TERMS
        ?.split(',')
        .map((term) => term.trim())
        .filter(Boolean);

    return configuredTerms?.length ? configuredTerms : DEFAULT_SEARCH_TERMS;
};

const createSearchUrl = (page: number) => {
    const url = new URL(SEARCH_ENDPOINT);
    url.searchParams.set('page', String(page));
    console.log(`process page ${page} [${url.toString()}]`);
    return url.toString();
};

const getSearchPages = (totalPages: number) => {
    const pages: number[] = [];
    const lastPage = Math.max(1, Math.min(totalPages, SEARCH_PAGE_LIMIT));

    for (let page = 1; page <= lastPage; page += 1) {
        pages.push(page);
    }

    return pages;
};

const getSearchArticleUrls = (searchTerms: string[]) => {
    const firstPageResponse = fetchTextSync(createSearchUrl(1));
    const totalPages = extractTotalPagesFromSearchResponse(firstPageResponse);
    const articleUrls: string[] = [];

    getSearchPages(totalPages).forEach((page) => {
        const searchResponse = page === 1 ? firstPageResponse : fetchTextSync(createSearchUrl(page));
        const pageArticleUrls = extractArticleUrlsFromSearchResponse(searchResponse, searchTerms);

        if (pageArticleUrls.length === 0) {
            return;
        }

        articleUrls.push(...pageArticleUrls);
    });

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

const toFeed = (
    fansNewsUrl: string,
    abgerufenAm: string,
    searchTerms: string[],
    events: LotteryEvent[],
): LotteryFeed => {
    return {
        quelle: {
            abgerufenAm,
            fansNewsUrl,
            searchTerms,
        },
        termine: sortEvents(events),
        verein: CLUB,
    };
};

const formatUpdatedAt = (updatedAt: string | null) => {
    if (!updatedAt) {
        return 'unbekannt';
    }

    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(updatedAt));
};

const createDescription = (event: LotteryEvent) => {
    return [
        `- Partie: ${event.partie}`,
        `- Aktualisiert: ${formatUpdatedAt(event.updatedAt)}`,
        `- Quelle: ${event.articleUrl}`,
    ].join('\n');
};

const toIcs = (events: LotteryEvent[]) => {
    return createLotteryIcs(
        sortEvents(events).map((event) => ({
            description: createDescription(event),
            endsAt: event.endsAt,
            startsAt: event.startsAt,
            summary: event.summary,
            uid: `${createUid(event)}@eiserner-kalender`,
            url: event.articleUrl,
        })),
    );
};

const getUniqueOpponents = (values: string[]) => {
    return Array.from(new Set(values.map((value) => getCanonicalTeamName(value)))).sort((left, right) =>
        left.localeCompare(right, 'de-DE'),
    );
};

export const createLotteryCalendarDebugReport = (
    calendarGames: Spiel[],
    events: LotteryEvent[],
    searchTerms: string[],
): LotteryCalendarDebugReport => {
    const calendarGamesByOpponent = new Map(
        getUniqueOpponents(calendarGames.map(({ gegner }) => gegner)).map((opponent) => [
            normalizeTeamValue(opponent),
            opponent,
        ]),
    );
    const lotteryOpponentsByName = new Map(
        getUniqueOpponents(events.map(({ opponent }) => opponent)).map((opponent) => [
            normalizeTeamValue(opponent),
            opponent,
        ]),
    );
    const recognizedCalendarGames = Array.from(calendarGamesByOpponent.entries())
        .filter(([normalizedOpponent]) => lotteryOpponentsByName.has(normalizedOpponent))
        .map(([, opponent]) => opponent)
        .sort((left, right) => left.localeCompare(right, 'de-DE'));
    const missingCalendarGames = Array.from(calendarGamesByOpponent.entries())
        .filter(([normalizedOpponent]) => !lotteryOpponentsByName.has(normalizedOpponent))
        .map(([, opponent]) => opponent)
        .sort((left, right) => left.localeCompare(right, 'de-DE'));
    const unmatchedLotteryGames = Array.from(lotteryOpponentsByName.entries())
        .filter(([normalizedOpponent]) => !calendarGamesByOpponent.has(normalizedOpponent))
        .map(([, opponent]) => opponent)
        .sort((left, right) => left.localeCompare(right, 'de-DE'));

    return {
        calendarGameCount: calendarGamesByOpponent.size,
        missingCalendarGames,
        recognizedCalendarGameCount: recognizedCalendarGames.length,
        recognizedCalendarGames,
        searchTerms,
        unmatchedLotteryGames,
    };
};

export const createLotteryExport = (calendarGames: Spiel[] = []): LotteryExport => {
    const searchTerms = getSearchTerms();
    const articleUrls = getSearchArticleUrls(searchTerms);
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
                opponent: getCanonicalTeamName(article.opponent),
                partie: article.partie,
                startsAt: event.startsAt,
                summary: event.summary,
                type: event.type,
                updatedAt: article.updatedAt,
            })),
        );
    const abgerufenAm = new Date().toISOString().slice(0, 10);
    const feed = toFeed(SEARCH_ENDPOINT, abgerufenAm, searchTerms, events);

    return {
        abgerufenAm,
        debug: createLotteryCalendarDebugReport(calendarGames, feed.termine, searchTerms),
        fansNewsUrl: SEARCH_ENDPOINT,
        ics: toIcs(feed.termine),
        json: JSON.stringify(feed, null, 2),
    };
};
