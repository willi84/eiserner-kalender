import { createIndexHtml } from './index';

describe('createIndexHtml()', () => {
    it('renders links, creation dates and the lottery debug summary', () => {
        const html = createIndexHtml(
            [
                {
                    abgerufenAm: '2026-04-12',
                    content: '{}',
                    format: 'json',
                    json: '{}',
                    label: 'Männer',
                    outputFile: 'unionspiele_maenner.json',
                },
                {
                    abgerufenAm: '2026-04-12',
                    content: 'BEGIN:VCALENDAR',
                    format: 'ics',
                    json: '{}',
                    label: 'Losverfahren iCal',
                    outputFile: 'union_lottery.ics',
                },
                {
                    abgerufenAm: '2026-04-12',
                    content: '{}',
                    format: 'json',
                    json: '{}',
                    label: 'Mannschafts-Synonyme',
                    outputFile: 'team-synonyms.json',
                },
            ],
            {
                calendarGameCount: 3,
                missingCalendarGames: ['1. FC Köln'],
                recognizedCalendarGameCount: 2,
                recognizedCalendarGames: ['FC St. Pauli', 'VfL Wolfsburg'],
                searchTerms: ['losverfahren', 'lostermine'],
                unmatchedLotteryGames: ['RB Leipzig'],
            },
        );

        expect(html).toContain('./unionspiele_maenner.json');
        expect(html).toContain('./union_lottery.ics');
        expect(html).toContain('./team-synonyms.json');
        expect(html).toContain('Format: JSON');
        expect(html).toContain('Format: ICS');
        expect(html).toContain('Erstellt am: 2026-04-12');
        expect(html).toContain('Debug Kalenderabgleich Losverfahren');
        expect(html).toContain('Erkannte Heimspiele aus Kalender: 2/3');
        expect(html).toContain('1. FC Köln');
        expect(html).toContain('RB Leipzig');
    });
});
