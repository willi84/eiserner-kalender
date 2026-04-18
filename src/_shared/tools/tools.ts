import type { KEY_VALUES } from './tools.d';

/**
 * 🎯 substitute placeholders in a string with values from an object
 * @param {string} str ➡️ The string containing placeholders.
 * @param {KEY_VALUES} replacements ➡️ An object with key-value pairs for replacements.
 * @returns {string} 📤 The modified string with placeholders replaced.
 */
export const substitute = (str: string, replacements: KEY_VALUES): string => {
    return Object.keys(replacements).reduce((acc, key) => {
        const value = replacements[key];
        return acc.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }, str);
};