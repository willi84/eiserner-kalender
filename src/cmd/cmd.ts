// import { LOG } from '../log/log';
import { execSync } from 'node:child_process';
export const command = (command: string, doLog = false, showError = false) => {
    let output: string = '';
    let errorText: string = '';
    try {
        output = execSync(`${command}`, { timeout: 10000 }).toString();
    } catch (e: any) {
        errorText = e;
    }
    return output.toString();
};