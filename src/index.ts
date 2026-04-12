import { mkdir, writeFile } from 'node:fs/promises';
import { getEvents } from './events/events';

const ICS_URL = 'https://kalender.textilvergehen.de/unionspiele_maenner.ics';
const OUTPUT_FILE = 'output/events.json';

const fetchIcs = async () => {
    const response = await fetch(ICS_URL);
    if (!response.ok) {
        throw new Error(`ICS download failed with status ${response.status}`);
    }

    return response.text();
};

const writeJson = async (content: string) => {
    await mkdir('output', { recursive: true });
    await writeFile(OUTPUT_FILE, content);
};

const main = async () => {
    const ics = await fetchIcs();
    const abgerufenAm = new Date().toISOString().slice(0, 10);
    const events = getEvents(ICS_URL, ics, abgerufenAm);
    const json = JSON.stringify(events, null, 2);

    await writeJson(json);
    console.log(json);
};

main().catch((error: Error) => {
    console.error(error.message);
    process.exitCode = 1;
});
