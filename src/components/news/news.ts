import { LOG } from '@_shared/log/log';
import { normalizeText, unique } from '@_shared/sanitize/sanitize';
import type { NewsResponse } from './news.d';
import { SEARCH_PAGE_LIMIT } from '@config/config';
import { getJSON } from '@_shared/fetch/fetch';
import { ENDPOINT } from '@config/endpoint';

const toAbsoluteUrl = (url: string, endpoint: ENDPOINT) => {
    return `${endpoint.host}${url}`;
}

export const matchesSearchTerms = (headline: string, searchTerms: string[]) => {
    const normalizedHeadline = normalizeText(headline);

    return searchTerms.some((searchTerm) => normalizedHeadline.includes(normalizeText(searchTerm)));
};

export const getNewsUrls = (searchTerms: string[], json: NewsResponse) => {
    if (!Array.isArray(json?.data?.news)) {
        return [];
    }
    const newsUrls = json.data?.news
        .filter(({ headline }) => matchesSearchTerms(headline, searchTerms))
        .map(({ detailLink }) => detailLink) ?? [];

    return newsUrls;
};
// TODO: still used?
export const getSearchPages = (limit: number, totalPages?: number) => {
    const pages: number[] = [];
    const lastPage = Math.max(1, Math.min(totalPages ?? limit, limit));

    for (let page = 1; page <= lastPage; page += 1) {
        pages.push(page);
    }

    return pages;
};

export const getSearchArticleUrls = (searchTerms: string[], endpoint: ENDPOINT) => {

    const articleUrls: string[] = [];
    let totalPages = SEARCH_PAGE_LIMIT;

    for (let page = 1; page <= SEARCH_PAGE_LIMIT; page += 1) {
        if (page > totalPages) {
            break;
        }

        const json = getJSON(`${endpoint.url}${page}`);
        totalPages = json?.data?.totalPages ?? 0;

        if (page > totalPages) {
            LOG.WARN(`Seite ${page} existiert nicht (nur ${totalPages} Seiten insgesamt), überspringe weitere Anfragen...`);
            break;
        }

        const pageArticleUrls = getNewsUrls(searchTerms, json).map((url) => toAbsoluteUrl(url, endpoint));

        if (pageArticleUrls.length === 0) {
            continue;
        }

        articleUrls.push(...pageArticleUrls);
    }

    return unique(Array.from(new Set(articleUrls)));
};

