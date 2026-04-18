const MULTIPLE_NEWLINES_PATTERN = /\n{2,}/g;
const MULTIPLE_SPACES_PATTERN = /[ \t]{2,}/g;

export const normalizeText = (value: string) => {
    return value
        .toLocaleLowerCase('de-DE')
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss');
};

export const unique = (values: string[]) => Array.from(new Set(values));

export const decodeHtml = (value: string) => {
    return value
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&uuml;/g, 'ü')
        .replace(/&Uuml;/g, 'Ü')
        .replace(/&ouml;/g, 'ö')
        .replace(/&Ouml;/g, 'Ö')
        .replace(/&auml;/g, 'ä')
        .replace(/&Auml;/g, 'Ä')
        .replace(/&szlig;/g, 'ß');
};
export const normalizeWhitespace = (value: string) => {
    return value
        .replace(/\r/g, '')
        .replace(MULTIPLE_SPACES_PATTERN, ' ')
        .replace(MULTIPLE_NEWLINES_PATTERN, '\n')
        .split('\n')
        .map((line) => decodeHtml(line).trim())
        .filter(Boolean)
        .join('\n');
};

const escapeRegExp = (value: string) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getEscapedChar = (char: string) => {
    return char === '\n' ? '\\n' : `\\${char}`;
};

export const escapeCharSet = (value: string, chars: readonly string[]) => {
    let escapedValue = value;
    chars.forEach((char) => {
        const escapePattern = new RegExp(escapeRegExp(char), 'g');
        escapedValue = escapedValue.replace(escapePattern, getEscapedChar(char));
    });
    return escapedValue;
};
