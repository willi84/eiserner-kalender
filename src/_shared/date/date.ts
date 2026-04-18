export const getIsoWeek = (date: Date) => {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return { isoWeekYear: target.getUTCFullYear(), kalenderwoche: week };
};
export const toIsoDateTime = (startsAtLine: string) => {
    const match = startsAtLine.match(/^DTSTART(?:;TZID="([+-]\d{2}:\d{2})")?:(\d{8})T(\d{6})$/);
    const timezone = match?.[1] ?? 'Z';
    const date = match?.[2] ?? '';
    const time = match?.[3] ?? '';
    const isoDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    const isoTime = `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;

    return `${isoDate}T${isoTime}${timezone}`;
};