export const getIsoWeek = (date: Date) => {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return { isoWeekYear: target.getUTCFullYear(), kalenderwoche: week };
};
export const toIsoDateTime = (startsAtLine: string) => {
    const match = startsAtLine.match(/^DTSTART(?:;TZID=(?:"([^\"]+)"|([^:]+)))?:(\d{8})T(\d{6})(Z)?$/);
    const timezoneId = match?.[1] ?? match?.[2] ?? '';
    const timezone = match?.[5] ? 'Z' : normalizeTimezone(timezoneId);
    const date = match?.[3] ?? '';
    const time = match?.[4] ?? '';
    const isoDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    const isoTime = `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;

    return `${isoDate}T${isoTime}${timezone}`;
};

export const toUtcIcalDateTime = (localDateTime: string, timeZone: string) => {
    const utcDate = toUtcDate(localDateTime, timeZone);
    return utcDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
};

const toUtcDate = (localDateTime: string, timeZone: string) => {
    const { year, month, day, hour, minute, second } = parseLocalDateTime(localDateTime);
    const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
    const offsetMinutes = getTimeZoneOffsetMinutes(timeZone, new Date(utcGuess));

    return new Date(utcGuess - offsetMinutes * 60_000);
};

const parseLocalDateTime = (localDateTime: string) => {
    const match = localDateTime.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
    );

    if (!match) {
        throw new Error(`Invalid local date-time: ${localDateTime}`);
    }

    const [, year, month, day, hour, minute, second] = match;
    return {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second),
    };
};

const getTimeZoneOffsetMinutes = (timeZone: string, date: Date) => {
    const timeZoneName = new Intl.DateTimeFormat('en-US', {
        timeZone,
        timeZoneName: 'longOffset',
    })
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')
        ?.value ?? '';

    if (timeZoneName === 'GMT') {
        return 0;
    }

    const match = timeZoneName.match(/^GMT([+-]\d{2}):(\d{2})$/);
    if (!match) {
        throw new Error(`Unsupported timezone offset for ${timeZone}: ${timeZoneName}`);
    }

    const [, hours, minutes] = match;
    const sign = hours.startsWith('-') ? -1 : 1;
    return sign * (Math.abs(Number(hours)) * 60 + Number(minutes));
};

const normalizeTimezone = (timezoneId: string) => {
    if (!timezoneId) {
        return 'Z';
    }

    const match = timezoneId.match(/^([+-]\d{2}):?(\d{2})$/);
    if (!match) {
        return '';
    }

    return `${match[1]}:${match[2]}`;
};
