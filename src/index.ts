import { command } from './cmd/cmd';

console.log('golem');


const cmd = `curl https://kalender.textilvergehen.de/unionspiele_maenner.ics`;
const data = command(cmd);
console.log(data);