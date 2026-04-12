import { createIndexHtml } from './index';

describe('createIndexHtml()', () => {
    it('renders links and creation dates for all exports', () => {
        const html = createIndexHtml([
            {
                abgerufenAm: '2026-04-12',
                json: '{}',
                label: 'Männer',
                outputFile: 'unionspiele_maenner.json',
            },
            {
                abgerufenAm: '2026-04-12',
                json: '{}',
                label: 'Frauen',
                outputFile: 'unionspiele_frauen.json',
            },
        ]);

        expect(html).toContain('./unionspiele_maenner.json');
        expect(html).toContain('./unionspiele_frauen.json');
        expect(html).toContain('Erstellt am: 2026-04-12');
    });
});
