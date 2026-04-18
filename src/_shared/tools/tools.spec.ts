import { substitute } from './tools';

describe('✅ substitue()', () => {
    const FN = substitute;
    it('substitues values in string', () => {
        const template = 'Hello {name}! Welcome 2 {place}.';
        const values = { name: 'Alice', place: 'Wonderland' };
        expect(FN(template, values)).toBe('Hello Alice! Welcome 2 Wonderland.');
    });
    it('substitues missing values in string', () => {
        const template = 'Hello, {name}! Welcome to {place}.';
        const values = { name: 'Bob' };
        expect(FN(template, values)).toBe('Hello, Bob! Welcome to {place}.');
    });
    it('stringifies non-string replacements', () => {
        const template = '{count} Einträge aktiv={active}';
        const values = { count: 3, active: false };
        expect(FN(template, values)).toBe('3 Einträge aktiv=false');
    });
});