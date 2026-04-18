import { Json } from '@_shared/types';
import { CALENDAR_ID, CLUB, SUMMARY_TYPES } from '@config/config';
import { createIcsContent } from '../ical/ical';
import type { LotteryEventType, SOURCE } from '@apps/lottery/lottery.d';
import { createHash } from 'crypto';
import type { LotteryEvent } from '@apps/lottery/lottery.d';
import { getCanonicalTeamName } from '../../../teams/team-synonyms/team-synonyms';
import type { LotteryArticle } from 'lottery/parser/parser.d';

export const createUid = (event: LotteryEvent) => {
    console.log(event);
    return createHash('sha1')
        .update(`${event.type}|${event.opponent}|${event.startsAt}|${event.articleUrl}`)
        .digest('hex');
};
export const formatUpdatedAt = (updatedAt: string | null) => {
    if (!updatedAt) {
        return 'unbekannt';
    }

    return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(updatedAt));
};
export const createDescription = (event: LotteryEvent, club: string) => {
    const partie = createMatch(club, event)
    return [
        `- Partie: ${partie}`,
        `- Aktualisiert: ${formatUpdatedAt(event.updatedAt)}`,
        `- Quelle: ${event.articleUrl}`,
    ].join('\n');
};
export const createSummary = (type: LotteryEventType, opponent: string) => {
    const summaryType: string = SUMMARY_TYPES[type] || 'unknown Event';

    return `${summaryType}: ${opponent}`;
};
export const createMatch = (home: string, article: LotteryEvent) => {
    const opponent = article.opponent;
    const isHome = article.isHome;
    return isHome ? `${home} vs. ${opponent}` : `${opponent} vs. ${home}`;
}
export const sortEvents = (events: LotteryEvent[]) => {
    return [...events].sort((left, right) => left.startsAt.localeCompare(right.startsAt));
};
export const toIcs = (json: Json) => {
    const events = json.termine;
    const club = json.verein;
    return createIcsContent(
        sortEvents(events).map((event) => ({
            description: createDescription(event, club),
            endsAt: event.endsAt,
            startsAt: event.startsAt,
            summary: createSummary(event.type, event.opponent),
            uid: `${createUid(event)}@${CALENDAR_ID}`,
            url: event.articleUrl,
        })),
    );
};
export const toJson = (json: Json) => {
    const termine = json.termine;
    const source = json.source;
    const result: Json = {
        source,
        termine: [],
        verein: json.verein,
    }
    for(const event of termine){
        const item: LotteryEvent = {
            ...event, 
            partie: createMatch(json.verein, event),
            summary: createSummary(event.type, event.opponent),
        };
        result.termine.push(item);
    }
    // sorting
    result.termine = sortEvents(result.termine);
    return result;
}
export const createEventItems = (articlePayloads: LotteryArticle[][]) => {
    return articlePayloads
        .flat()
        .flatMap((article) =>
            article.events.map((event: any) => ({
                articleUrl: article.articleUrl,
                updatedAt: article.updatedAt,
                startsAt: event.startsAt,
                endsAt: event.endsAt,
                type: event.type,
                opponent: getCanonicalTeamName(article.opponent),
                isHome: article.isHome,
            })),
        );
}
export const createEventJSON = (articlePayloads: LotteryArticle[][], source: SOURCE): Json => {
    const events = createEventItems(articlePayloads);
    return {
        source,
        termine: events,
        verein: CLUB
    };
};