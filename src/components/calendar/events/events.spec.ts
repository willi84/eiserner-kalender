
import { FS } from '@_shared/fs/fs';
import { getEvents } from './events';
import { BASE_ICAL } from '@config/endpoints';

describe('getEvents()', () => {
    const url = `${BASE_ICAL}unionspiele_maenner.ics`;
    const abgerufenAm = '2026-04-12';

    it('should return parsed event data from the ics file', () => {
        const mockedIcs: string = FS.readFile('src/components/calendar/events/events.ics') || '';

        expect(getEvents(url, mockedIcs, abgerufenAm)).toEqual({
            verein: '1. FC Union Berlin',
            wettbewerb: 'Bundesliga',
            saison: '2025/26',
            quelle: {
                name: 'kalender.textilvergehen.de',
                url,
                abgerufenAm,
            },
            spiele: [
                {
                    datum: '2025-07-12',
                    isoWeekYear: 2025,
                    kalenderwoche: 28,
                    gegner: 'Brandenburger SC Süd 05',
                    spielort: 'auswaerts',
                    anstoss: '2025-07-12T15:30:00+02:00',
                },
                {
                    datum: '2025-08-23',
                    isoWeekYear: 2025,
                    kalenderwoche: 34,
                    gegner: 'VfB Stuttgart',
                    spielort: 'heim',
                    anstoss: '2025-08-23T15:30:00+02:00',
                },
                {
                    datum: '2025-10-29',
                    isoWeekYear: 2025,
                    kalenderwoche: 44,
                    gegner: 'DSC Arminia Bielefeld',
                    spielort: 'heim',
                    anstoss: '2025-10-29T20:45:00+01:00',
                },
            ],
        });
    });

    it('normalizes configured opponent aliases to a central team name', () => {
        const mockedIcs = [
            'BEGIN:VCALENDAR',
            'BEGIN:VEVENT',
            'DTSTART;TZID="+02:00":20250823T153000',
            'SUMMARY:1. FC Union Berlin vs. 1. FC Koeln',
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\n');

        expect(getEvents(url, mockedIcs, abgerufenAm).spiele).toEqual([
            {
                datum: '2025-08-23',
                isoWeekYear: 2025,
                kalenderwoche: 34,
                gegner: '1. FC Köln',
                spielort: 'heim',
                anstoss: '2025-08-23T15:30:00+02:00',
            },
        ]);
    });

    it('normalizes newly configured second division teams', () => {
        const mockedIcs = [
            'BEGIN:VCALENDAR',
            'BEGIN:VEVENT',
            'DTSTART;TZID="+02:00":20250913T133000',
            'SUMMARY:1. FC Union Berlin vs. Hertha Berlin',
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\n');

        expect(getEvents(url, mockedIcs, abgerufenAm).spiele).toEqual([
            {
                datum: '2025-09-13',
                isoWeekYear: 2025,
                kalenderwoche: 37,
                gegner: 'Hertha BSC',
                spielort: 'heim',
                anstoss: '2025-09-13T13:30:00+02:00',
            },
        ]);
    });
});
