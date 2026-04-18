
import type { EventsResult, Spiel, Spielort } from './events.d';
import { getCanonicalTeamName } from '../../../teams/team-synonyms/team-synonyms';
import { COMPETITION_NAME, CURRENT_SEASON, DEBUG, HOME_TEAM } from '../../../config/config';
import { getIsoWeek, toIsoDateTime } from '@_shared/date/date';
import { LOG } from '@_shared/log/log';
import { extractEventBlocks, getDateStart, readDateStart, readField } from '../ical/ical';

const SUMMARY_PREFIX = 'SUMMARY:';

const parseTeams = (summary: string) => {
    const [homeTeam = '', awayTeam = ''] = summary.split(' vs. ');
    const isHome = homeTeam === HOME_TEAM;
    const gegner = getCanonicalTeamName(isHome ? awayTeam : homeTeam);

    return {
        gegner,
        spielort: (isHome ? 'heim' : 'auswaerts') as Spielort,
    };
};



const parseEventBlock = (block: string, index: number, debug = false): Spiel => {
    const startsAtLine = readDateStart(block);
    const summary = readField(block, SUMMARY_PREFIX);

    if (!summary) {
        LOG.FAIL('Event summary missing', { index });
    }

    const kickoffDate = getDateStart(block, index);
    const { isoWeekYear, kalenderwoche } = getIsoWeek(kickoffDate);
    const { gegner, spielort } = parseTeams(summary);
    const anstoss = toIsoDateTime(startsAtLine);

    DEBUG && LOG.INFO('Event parsed', {
        index,
        summary,
        gegner,
        spielort,
        anstoss,
    });
    return {
        datum: anstoss.slice(0, 10),
        isoWeekYear,
        kalenderwoche,
        gegner,
        spielort,
        anstoss,
    };
};

const getSourceName = (url: string) => new URL(url).hostname;

export const convertIcsToJSON = (ics: string, debug = false): Spiel[] => {
    const blocks = extractEventBlocks(ics);

    LOG.INFO('VEVENT blocks extracted', {
        blockCount: blocks.length,
        icsLength: ics.length,
    });

    if (blocks.length === 0) {
        LOG.WARN('No VEVENT blocks found in ICS payload');
    }

    return blocks.map((block, index) => parseEventBlock(block, index, debug));
};

export const getEvents = (url: string, ics: string, abgerufenAm: string, debug = false): EventsResult => {
    const spiele = convertIcsToJSON(ics, debug);

    LOG.INFO('Events payload built', {
        url,
        fetchedAt: abgerufenAm,
        eventCount: spiele.length,
    });
    console.log(getSourceName(url))

    return {
        verein: HOME_TEAM,
        wettbewerb: COMPETITION_NAME,
        saison: CURRENT_SEASON,
        quelle: {
            name: getSourceName(url),
            url,
            abgerufenAm,
        },
        spiele,
    };
};
