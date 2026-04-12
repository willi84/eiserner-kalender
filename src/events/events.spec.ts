import { readFileSync } from 'node:fs';
import { getEvents } from './events';

describe('getEvents()', () => {
    const url = 'https://kalender.textilvergehen.de/unionspiele_maenner.ics';
    const abgerufenAm = '2026-04-12';

    it('should return parsed event data from the ics file', () => {
        const mockedIcs = readFileSync('src/events/events.ics', 'utf8');

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
                    gegner: 'Arminia Bielefeld',
                    spielort: 'heim',
                    anstoss: '2025-10-29T20:45:00+01:00',
                },
            ],
        });
    });
});
