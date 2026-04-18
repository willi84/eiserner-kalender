export const IS_LIVE = process.argv.includes('--live');

import type { LotteryEventType } from '@apps/lottery/lottery.d';
import { TEXT_RECOGNITION_SYNONYMS } from './text-recognition-synonyms';

export const CLUB = '1. FC Union Berlin';
export const DEFAULT_SEARCH_TERMS = [...TEXT_RECOGNITION_SYNONYMS.lottery];
export const SEARCH_PAGE_LIMIT = IS_LIVE ? 50 :  5;

export const DEBUG = false;
export const HOME_TEAM = '1. FC Union Berlin';

// TODO: dynamically determine current season and competition name
export const COMPETITION_NAME = 'Bundesliga';
export const CURRENT_SEASON = '2025/26';

export const OUTPUT_DIR = 'output';
export const CALENDAR_ID = 'eiserner-kalender';

export const SUMMARY_TYPES: { [key in LotteryEventType]: string } = {
    'losbuchung': '⚽️🎲 Losbuchung',
    'losgewinnerverkauf': '⚽️🎟️ Losgewinnerverkauf',
    'unknown': 'unknown Event'
}