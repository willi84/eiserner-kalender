import { parse } from 'node-html-parser';
import { getCanonicalTeamName } from '../../teams/team-synonyms/team-synonyms';
import type { LotteryArticle, LotteryArticleEvent } from './parser.d';
import { normalizeWhitespace } from '@_shared/sanitize/sanitize';
import { matchesSearchTerms } from '@component/news/news';


const PARTIE_PATTERN = /^(.+)\s+vs\.?\s*(.+)$/i;
const LOSBUCHUNG_LABELS = ['Losbuchung', 'Platzkarte Losbuchung'];
const LOSGEWINNER_LABELS = ['Losgewinner', 'Platzkarte Losgewinner', 'Gewinner', 'Gewinnerverkauf'];

const REGEX_DATES = [
    /(\d{2}\.\d{2}\.\d{4})\s*\|\s*(\d{1,2})(?::(\d{2}))?\s*Uhr\s+bis\s+\S+\s*\|\s*(\d{2}\.\d{2}\.\d{4})\s*\|\s*(\d{1,2})(?::(\d{2}))?\s*Uhr/i, // 'Fr | 17.04.2026 | 10 Uhr bis Mo | 20.04.2026 | 09 Uhr'
    /(\d{2}\.\d{2}\.\d{4})\s*(\d{1,2}):(\d{2})\s*-\s*(\d{2}\.\d{2}\.\d{4})\s*(\d{1,2}):(\d{2})/i, // '20.03.2026 10:00 - 23.03.2026 09:00'
    /(\d{2}\.\d{2}\.\d{4})\s*\|\s*(\d{1,2}):(\d{2})\s*Uhr\s*bis\s*(\d{2}\.\d{2}\.\d{4})\s*\|\s*(\d{1,2}):(\d{2})\s*Uhr/i, // '20.03.2026 | 10:00 Uhr bis 23.03.2026 | 09:00 Uhr'
]

const findMatchingLines = (text: string, pattern: RegExp) => {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => pattern.test(line));
};
/**
 * generic date matching function
 */
const matchDateRegex  = (line: string, regex: RegExp) => {
    const match = line.match(
        regex,
    );

    if (!match) {
        return null;
    }

    const [, startDate, startHour, startMinute = '00', endDate, endHour, endMinute = '00'] = match;
    return {
        start: {
            startDate, startHour, startMinute,
        },
        end: {
            endDate, endHour, endMinute,
        }
    };
};

export const parseGermanDateLine = (line: string) => {
    const parsed = REGEX_DATES.map((regex) => matchDateRegex(line, regex)).find((result) => result !== null);

    if (!parsed) {
        return null;
    }
    
    const { start: { startDate, startHour, startMinute }, end: { endDate, endHour, endMinute } } = parsed;

    const toIso = (date: string, hour: string, minute: string) => {
        const [day, month, year] = date.split('.');
        return `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
    };

    return {
        startsAt: toIso(startDate, startHour, startMinute),
        endsAt: toIso(endDate, endHour, endMinute),
    };
};

const extractEvent = (lines: string[], index: number) => {
    const label = lines[index];
    const dateLine = lines[index + 1] ?? '';
    const parsedDateLine = parseGermanDateLine(dateLine);

    if (!parsedDateLine) {
        return null;
    }

    const type = matchesSearchTerms(label, LOSBUCHUNG_LABELS) ? 'losbuchung' : matchesSearchTerms(label, LOSGEWINNER_LABELS) ? 'losgewinnerverkauf' : 'unknown';

    return {
        type,
        startsAt: parsedDateLine.startsAt,
        endsAt: parsedDateLine.endsAt,
    } satisfies LotteryArticleEvent;
};

export const parseLotteryArticle = (articleUrl: string, html: string): LotteryArticle[] => {
    const root = parse(html);
    const content = root.querySelector('.richtext-table') ?? root.querySelector('article') ?? root;
    const text = normalizeWhitespace(content.structuredText);
    const lines = text.split('\n');
    const updatedAt = root.querySelector('time')?.getAttribute('datetime') ?? null; // TODO
    const parties = findMatchingLines(text, PARTIE_PATTERN)
        .map((partie) => {
            const teams = partie.split(/vs\.*/i).map((team) => team.trim());
            const isHome = Boolean(teams[0].toLowerCase().match(/union\s*berlin\s*/i));
            const opponent = isHome ? teams[1] : teams[0];
            return {
                opponent: getCanonicalTeamName(opponent),
                isHome,
                partie,
            };
        })
        .filter(({ opponent }) => Boolean(opponent));

    if (parties.length === 0) {
        return [];
    }

    const articles = parties.map(({ opponent, isHome }) => ({
        opponent,
        articleUrl,
        isHome,
        updatedAt,
        events: [] as LotteryArticleEvent[],
    }));

    let matchIndex = -1;
    const TYPE_LABELS = [...LOSGEWINNER_LABELS, ...LOSBUCHUNG_LABELS];
    lines.forEach((line, index) => {
        // get index of current match
        if (PARTIE_PATTERN.test(line)) {
            matchIndex += 1;
            return;
        }

        if (matchIndex < 0) {
            return;
        }
        if (matchesSearchTerms(line, TYPE_LABELS)) {
            // use label as start
            const event = extractEvent(lines, index);
            if (event) {
                articles[matchIndex].events.push(event);
            }
        } else {
            return;
        }
    });

    return articles.filter((article) => article.events.length > 0);
};
