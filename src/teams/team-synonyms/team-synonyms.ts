import { TEAM_SYNONYMS_CONFIG, type TeamSynonymsConfig } from '../../config/team-synonyms';

const OUTPUT_FILE = 'team-synonyms.json';

export const normalizeTeamValue = (value: string) => {
    return value
        .trim()
        .toLocaleLowerCase('de-DE')
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '');
};

const sanitizeConfig = (config: TeamSynonymsConfig) => {
    const teams = Object.entries(config.teams).reduce<Record<string, string[]>>((result, [canonicalName, aliases]) => {
        const normalizedAliases = Array.isArray(aliases)
            ? aliases.map((alias) => alias.trim()).filter(Boolean)
            : [];

        result[canonicalName.trim()] = Array.from(new Set(normalizedAliases));
        return result;
    }, {});

    return {
        version: config.version,
        teams,
    } satisfies TeamSynonymsConfig;
};

const createLookup = (config: TeamSynonymsConfig) => {
    return Object.entries(config.teams).reduce<Map<string, string>>((lookup, [canonicalName, aliases]) => {
        const canonical = canonicalName.trim();
        lookup.set(normalizeTeamValue(canonical), canonical);
        aliases.forEach((alias) => lookup.set(normalizeTeamValue(alias), canonical));
        return lookup;
    }, new Map());
};

export const getTeamSynonymsOutputFile = () => OUTPUT_FILE;

export const createTeamSynonymsOutputContent = (config: TeamSynonymsConfig = TEAM_SYNONYMS_CONFIG) => {
    return `${JSON.stringify(sanitizeConfig(config), null, 2)}\n`;
};

export const getCanonicalTeamName = (teamName: string, config = TEAM_SYNONYMS_CONFIG) => {
    const canonicalName = createLookup(config).get(normalizeTeamValue(teamName));
    return canonicalName ?? teamName.trim();
};
