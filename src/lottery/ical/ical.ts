type IcalEvent = {
    description: string;
    endsAt: string;
    startsAt: string;
    summary: string;
    uid: string;
    url: string;
};

const escapeIcal = (value: string) => {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
};

const toIcalDate = (value: string) => value.replace(/[-:]/g, '').slice(0, 15);

const createEventBlock = (event: IcalEvent, dtStamp: string) => {
    return [
        'BEGIN:VEVENT',
        `UID:${event.uid}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART:${toIcalDate(event.startsAt)}`,
        `DTEND:${toIcalDate(event.endsAt)}`,
        `SUMMARY:${escapeIcal(event.summary)}`,
        `DESCRIPTION:${escapeIcal(event.description)}`,
        `URL:${escapeIcal(event.url)}`,
        'END:VEVENT',
    ].join('\r\n');
};

export const createLotteryIcs = (events: IcalEvent[]) => {
    const dtStamp = `${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`;
    const eventBlocks = events.map((event) => createEventBlock(event, dtStamp));

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Eiserner Kalender//Lottery//DE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        ...eventBlocks,
        'END:VCALENDAR',
        '',
    ].join('\r\n');
};
