import { createIndexHtml } from './index';

describe('createIndexHtml()', () => {
    it('renders links and creation dates for all exports', () => {
        const html = createIndexHtml([
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
        ]);

        expect(html).toContain('./unionspiele_maenner.json');
        expect(html).toContain('./union_lottery.ics');
        expect(html).toContain('Format: JSON');
        expect(html).toContain('Format: ICS');
        expect(html).toContain('Erstellt am: 2026-04-12');
    });
});
