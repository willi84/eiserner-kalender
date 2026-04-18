import type { Spiel } from '@component/calendar/events/events.d';
import { getCanonicalTeamName, normalizeTeamValue } from '../../teams/team-synonyms/team-synonyms';
import {
    parseLotteryArticle,
} from '../../lottery/parser/parser';
import type { LotteryCalendarDebugReport, LotteryEvent, SOURCE } from './lottery.d';
import { getSearchArticleUrls } from '@component/news/news';
import { getHTML } from '@_shared/fetch/fetch';
import { ENDPOINT } from '@config/endpoint';
import type { LotteryArticle } from 'lottery/parser/parser.d';
import type { Json } from '@_shared/types';
import { CLUB } from '@config/config';


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

// export const createEventItems = (articlePayloads: LotteryArticle[][]) => {
//     return articlePayloads
//         .flat()
//         .flatMap((article) =>
//             article.events.map((event: any) => ({
//                 articleUrl: article.articleUrl,
//                 updatedAt: article.updatedAt,
//                 startsAt: event.startsAt,
//                 endsAt: event.endsAt,
//                 type: event.type,
//                 opponent: getCanonicalTeamName(article.opponent),
//                 isHome: article.isHome,
//             })),
//         );
// }
export const getEventItemsFromEndpoints  = (endpoint: ENDPOINT, searchTerms: string[] = []): LotteryArticle[][] => {
    const articleUrls = getSearchArticleUrls(searchTerms, endpoint);
    const articlePayloads = articleUrls.map((articleUrl) => {
        const articleHtml = getHTML(articleUrl);
        return parseLotteryArticle(articleUrl, articleHtml);
    });
    return articlePayloads;
};

// export const createEventJSON = (articlePayloads: LotteryArticle[][], source: SOURCE): Json => {
//     const events = createEventItems(articlePayloads);
//     return {
//         source,
//         termine: events,
//         verein: CLUB
//     };
// };
