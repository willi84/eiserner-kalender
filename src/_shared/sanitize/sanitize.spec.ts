import { normalizeText, unique, decodeHtml, normalizeWhitespace } from './sanitize';


describe('normalizeText()', () => {
    const FN = normalizeText;

    it('normalizes German characters correctly', () => {
        expect(FN('Füße')).toEqual('fuesse');
        expect(FN('Mädchen')).toEqual('maedchen');
        expect(FN('Groß')).toEqual('gross');
        expect(FN('Köln')).toEqual('koeln');
    });

    it('converts text to lowercase', () => {
        expect(FN('HELLO')).toEqual('hello');
        expect(FN('World')).toEqual('world');
    });

    it('handles empty strings', () => {
        expect(FN('')).toEqual('');
    });
});
describe('unique()', () => {
    const FN = unique;

    it('returns unique values from an array', () => {
        expect(FN(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
        expect(FN(['1', '2', '3', '2'])).toEqual(['1', '2', '3']);
    });

    it('handles empty arrays', () => {
        expect(FN([])).toEqual([]);
    });
});
describe('decodeHtml()', () => {
    const FN = decodeHtml;
    it('decodes common HTML entities', () => {
        expect(FN('Hello&nbsp;World')).toEqual('Hello World');
        expect(FN('5 &amp; 10')).toEqual('5 & 10');
        expect(FN('&quot;Quoted&quot;')).toEqual('"Quoted"');
        expect(FN('It&#39;s a test')).toEqual("It's a test");
        expect(FN('München &uuml;ber alles')).toEqual('München über alles');
    });

    it('handles strings without HTML entities', () => {
        expect(FN('No entities here')).toEqual('No entities here');
    });
});
describe('normalizeWhitespace()', () => {
    const FN = normalizeWhitespace;
    it('normalizes multiple spaces and newlines', () => {
        const input = 'This   is a   test.\n\n\nNewlines   should be normalized.\r\nAnd  spaces too.';
        const expected = 'This is a test.\nNewlines should be normalized.\nAnd spaces too.';
        expect(FN(input)).toEqual(expected);
     });

    it('trims lines and removes empty lines', () => {
        const input = '  Line with spaces  \n\n  \nLine without spaces\n   \n';
        const expected = 'Line with spaces\nLine without spaces';
        expect(FN(input)).toEqual(expected);
     });
});


