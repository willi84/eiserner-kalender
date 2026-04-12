import { getEvents } from './events';

describe('getEvents()', () => {
    it('should reuturn data', () => {
        const FN = getEvents;
        expect(FN()).toEqual({});
    })
});