import { getIsoWeek, toIsoDateTime } from './date';

describe('getIsoWeek()', () => {
    const FN = getIsoWeek;

    it('calculates the correct ISO week and year for a given date', () => {
        expect(FN(new Date('2024-01-01'))).toEqual({ isoWeekYear: 2024, kalenderwoche: 1 });
        expect(FN(new Date('2024-12-31'))).toEqual({ isoWeekYear: 2025, kalenderwoche: 1 });
        expect(FN(new Date('2024-06-15'))).toEqual({ isoWeekYear: 2024, kalenderwoche: 24 });
        expect(FN(new Date('2023-12-30'))).toEqual({ isoWeekYear: 2023, kalenderwoche: 52 });
    });

    it('handles edge cases around the start and end of the year', () => {
        expect(FN(new Date('2020-12-28'))).toEqual({ isoWeekYear: 2020, kalenderwoche: 53 });
        expect(FN(new Date('2021-01-03'))).toEqual({ isoWeekYear: 2020, kalenderwoche: 53 });
        expect(FN(new Date('2021-01-04'))).toEqual({ isoWeekYear: 2021, kalenderwoche: 1 });
    });
});
describe('toIsoDateTime()', () => {
    const FN = toIsoDateTime;
    
    it('converts a valid DTSTART line to ISO 8601 format', () => {
        expect(FN('DTSTART:20240615T193000')).toBe('2024-06-15T19:30:00Z');
        expect(FN('DTSTART;TZID="+02:00":20240615T193000')).toBe('2024-06-15T19:30:00+02:00');
    });
});
