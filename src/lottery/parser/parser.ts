import { parse } from 'node-html-parser';
import { getCanonicalTeamName } from '../../teams/team-synonyms/team-synonyms';

type LotteryEventType = 'losbuchung' | 'losgewinnerverkauf';

type LotterySearchItem = {
    detailLink: string;
    headline: string;
};

type LotterySearchResponse = {
    data?: {
        news?: LotterySearchItem[];
        totalPages?: number;
    };
};

export type LotteryArticle = {
    opponent: string;
    articleUrl: string;
    partie: string;
    updatedAt: string | null;
    events: LotteryArticleEvent[];
};

export type LotteryArticleEvent = {
    type: LotteryEventType;
    startsAt: string;
    endsAt: string;
    summary: string;
};

const ARTICLE_BASE_URL = 'https://www.fc-union-berlin.de';
const OPPONENT_PATTERN = /^1\.\s*FC Union Berlin\s+vs\.?\s*(.+)$/i;
const PARTIE_PATTERN = /^1\.\s*FC Union Berlin\s+vs\.?\s*.+$/i;
const LOSBUCHUNG_LABEL = 'Losbuchung';
const LOSGEWINNER_LABEL = 'Platzkarte Losgewinner';
const MULTIPLE_NEWLINES_PATTERN = /\n{2,}/g;
const MULTIPLE_SPACES_PATTERN = /[ \t]{2,}/g;

const decodeHtml = (value: string) => {
    return value
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&uuml;/g, 'ü')
        .replace(/&Uuml;/g, 'Ü')
        .replace(/&ouml;/g, 'ö')
        .replace(/&Ouml;/g, 'Ö')
        .replace(/&auml;/g, 'ä')
        .replace(/&Auml;/g, 'Ä')
        .replace(/&szlig;/g, 'ß');
};

const normalizeWhitespace = (value: string) => {
    return value
        .replace(/\r/g, '')
        .replace(MULTIPLE_SPACES_PATTERN, ' ')
        .replace(MULTIPLE_NEWLINES_PATTERN, '\n')
        .split('\n')
        .map((line) => decodeHtml(line).trim())
        .filter(Boolean)
        .join('\n');
};

const normalizeText = (value: string) => {
    return value
        .toLocaleLowerCase('de-DE')
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss');
};

const toAbsoluteUrl = (url: string) => new URL(url, ARTICLE_BASE_URL).toString();

const unique = (values: string[]) => Array.from(new Set(values));

const matchesSearchTerms = (headline: string, searchTerms: string[]) => {
    const normalizedHeadline = normalizeText(headline);

    return searchTerms.some((searchTerm) => normalizedHeadline.includes(normalizeText(searchTerm)));
};

const findMatchingLines = (text: string, pattern: RegExp) => {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => pattern.test(line));
};

const parseGermanDateLine = (line: string) => {
    const match = line.match(
        /(\d{2}\.\d{2}\.\d{4})\s*\|\s*(\d{1,2})(?::(\d{2}))?\s*Uhr\s+bis\s+\S+\s*\|\s*(\d{2}\.\d{2}\.\d{4})\s*\|\s*(\d{1,2})(?::(\d{2}))?\s*Uhr/i,
    );

    if (!match) {
        return null;
    }

    const [, startDate, startHour, startMinute = '00', endDate, endHour, endMinute = '00'] = match;

    const toIso = (date: string, hour: string, minute: string) => {
        const [day, month, year] = date.split('.');
        return `${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
    };

    return {
        startsAt: toIso(startDate, startHour, startMinute),
        endsAt: toIso(endDate, endHour, endMinute),
    };
};

const createSummary = (type: LotteryEventType, opponent: string) => {
    if (type === 'losbuchung') {
        return `⚽️🎲 Losbuchung: ${opponent}`;
    }

    return `⚽️ Verkauf Losgewinner: ${opponent}`;
};

const extractEvent = (lines: string[], index: number, opponent: string) => {
    const label = lines[index];
    const dateLine = lines[index + 1] ?? '';
    const parsedDateLine = parseGermanDateLine(dateLine);

    if (!parsedDateLine) {
        return null;
    }

    const type = label === LOSBUCHUNG_LABEL ? 'losbuchung' : 'losgewinnerverkauf';

    return {
        type,
        startsAt: parsedDateLine.startsAt,
        endsAt: parsedDateLine.endsAt,
        summary: createSummary(type, opponent),
    } satisfies LotteryArticleEvent;
};

export const extractArticleUrlsFromSearchResponse = (payload: string, searchTerms: string[]) => {
    const response = JSON.parse(payload) as LotterySearchResponse;
    const articleUrls = (response.data?.news ?? [])
        .filter(({ headline }) => matchesSearchTerms(headline, searchTerms))
        .map(({ detailLink }) => toAbsoluteUrl(detailLink));

    return unique(articleUrls);
};

export const extractTotalPagesFromSearchResponse = (payload: string) => {
    const response = JSON.parse(payload) as LotterySearchResponse;
    return response.data?.totalPages ?? 1;
};

export const parseLotteryArticle = (articleUrl: string, html: string): LotteryArticle[] => {
    const root = parse(html);
    const content = root.querySelector('.richtext-table') ?? root.querySelector('article') ?? root;
    const text = normalizeWhitespace(content.structuredText);
    const lines = text.split('\n');
    const updatedAt = root.querySelector('time')?.getAttribute('datetime') ?? null;
    const parties = findMatchingLines(text, PARTIE_PATTERN)
        .map((partie) => {
            const match = partie.match(OPPONENT_PATTERN);
            return {
                opponent: getCanonicalTeamName(match?.[1]?.trim() ?? ''),
                partie,
            };
        })
        .filter(({ opponent }) => Boolean(opponent));

    if (parties.length === 0) {
        return [];
    }

    const articles = parties.map(({ opponent, partie }) => ({
        opponent,
        articleUrl,
        partie,
        updatedAt,
        events: [] as LotteryArticleEvent[],
    }));

    let currentOpponentIndex = -1;

    lines.forEach((line, index) => {
        if (PARTIE_PATTERN.test(line)) {
            currentOpponentIndex += 1;
            return;
        }

        if (currentOpponentIndex < 0) {
            return;
        }

        if (line !== LOSBUCHUNG_LABEL && line !== LOSGEWINNER_LABEL) {
            return;
        }

        const event = extractEvent(lines, index, articles[currentOpponentIndex].opponent);

        if (event) {
            articles[currentOpponentIndex].events.push(event);
        }
    });

    return articles.filter((article) => article.events.length > 0);
};
