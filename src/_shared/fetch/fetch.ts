import { command } from '../cmd/cmd';
import { LOG } from '../log/log';

const escapeShellArg = (value: string) => `'${value.replace(/'/g, `"'"'`)}'`;

export const fetchTextSync = (url: string) => {
    const cmd = `curl -sL ${escapeShellArg(url)}`;
    const response = command(`${cmd}`);
    if (!response || !response.trim()) {
        throw new Error(`Request failed for ${url}`);
    }

    return response;
};

export const getJSON = (url: string): any => {
    const data = fetchTextSync(url);
    try{
        const json = JSON.parse(data);
        return json;
    } catch(e: any){
        LOG.FAIL(`Failed to parse JSON from ${url}: ${e.message}`);
        return {};
    }
};
export const getHTML = (url: string): string => {
    const content = fetchTextSync(url);
    return content;
}
export const getText = (url: string): string => {
    return fetchTextSync(url);
};