import { createIndexHtml, ExportResult } from './index';

describe('createIndexHtml()', () => {
    it('renders file cards, logo usage and the lottery debug summary', () => {
        const html = createIndexHtml(
            [
                {
                    updatedAt: '2026-04-12',
                    content: '{}',
                    format: 'json',
                    json: '{}',
                    label: 'Männer',
                    outputFile: 'unionspiele_maenner.json',
                },
                {
                    updatedAt: '2026-04-12',
                    content: 'BEGIN:VCALENDAR',
                    format: 'ics',
                    json: '{}',
                    label: 'Losverfahren iCal',
                    outputFile: 'union_lottery.ics',
                },
                {
                    updatedAt: '2026-04-12',
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

        expect(html).toContain('assets/favicon.svg');
        // expect(html).toContain('./assets/logo.svg');
        expect(html).toContain('class="file-grid"');
        expect(html).toContain('class="file-card"');
        expect(html).toContain('./unionspiele_maenner.json');
        expect(html).toContain('./union_lottery.ics');
        expect(html).toContain('./team-synonyms.json');
        expect(html).toContain('Format: JSON');
        expect(html).toContain('Format: ICS');
        expect(html).toContain('Erstellt am: 2026-04-12');
        expect(html).toContain('Datei öffnen');
        expect(html).toContain('Debug Kalenderabgleich Losverfahren');
        expect(html).toContain('Erkannte Heimspiele aus Kalender: 2/3');
        expect(html).toContain('1. FC Köln');
        expect(html).toContain('RB Leipzig');
    });

    it('renders the final html with the new layout shell', () => {
        const EXPORTS: ExportResult[] = [
            {
                updatedAt: '2026-04-12',
                content: '{}',
                format: 'json',
                json: '{}',
                label: 'Männer',
                outputFile: 'unionspiele_maenner.json',
            },
        ];
        const LOTTERY_DEBUG = {
            calendarGameCount: 3,
            missingCalendarGames: ['1. FC Köln'],
            recognizedCalendarGameCount: 2,
            recognizedCalendarGames: ['FC St. Pauli', 'VfL Wolfsburg'],
            searchTerms: ['losverfahren', 'lostermine'],
            unmatchedLotteryGames: ['RB Leipzig'],
        };

        const result = createIndexHtml(EXPORTS, LOTTERY_DEBUG);

        expect(result).toContain('<section class="hero">');
        expect(result).toContain('<h1>Kalender & Exporte</h1>');
        expect(result).toContain('<strong>Männer</strong>');
        expect(result).toContain('<p class="file-name">unionspiele_maenner.json</p>');
        expect(result).toContain('<details class="debug">');
        expect(result).toContain('<h3>Status</h3>');
        expect(result).toContain('Suchbegriffe: losverfahren, lostermine');
    });
});
