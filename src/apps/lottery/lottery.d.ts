export type LotteryEventType = 'losbuchung' | 'losgewinnerverkauf' | 'unknown';

export type LotteryEvent = {
    articleUrl: string;
    updatedAt: string | null;
    startsAt: string;
    endsAt: string;
    type: LotteryEventType;
    opponent: string;
    isHome: boolean;
};

export type Item = {
    articleUrl: string;
    endsAt: string;
    opponent: string;
    partie?: string;
    startAt: string;
    isHome: boolean;
    summary?: string;
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
    // abgerufenAm: string;
    // debug: LotteryCalendarDebugReport;
    // fansNewsUrl: string;
    // ics: string;
    json: Json;
    // json: string;
};

type LotteryFeed = {
    source: SOURCE;
    termine: Item[];
    verein: string;
};
export type SOURCE = {
    searchTerms: string[];
    endpoint: string;
    updatedAt: string;
}
