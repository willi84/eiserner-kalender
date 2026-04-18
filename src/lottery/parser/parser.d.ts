

export type LotteryArticle = {
    opponent: string;
    articleUrl: string;
    isHome: boolean;
    updatedAt: string | null;
    events: LotteryArticleEvent[];
};

export type LotteryArticleEvent = {
    type: LotteryEventType;
    startsAt: string;
    endsAt: string;
};
