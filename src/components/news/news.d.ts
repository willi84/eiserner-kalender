type LotterySearchItem = {
    detailLink: string;
    headline: string;
};

export type NewsResponse = {
    data?: {
        news?: LotterySearchItem[];
        totalPages?: number;
    };
};