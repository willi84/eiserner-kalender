import * as fs from 'fs';
import { LOG } from './../log/log';
import * as path from 'path';
import type { FileItem } from './fs.d';

export enum Status {
    ERROR = -1,
    REMOVED = 0,
    CREATED = 1,
    ALREADY_EXISTS = 2,
    NOT_EXISTS = 3,
    NOT_EMPTY = 4,
    OVERWRITTEN = 5,
    EXTENDED = 6,
    NO_CHANGES = 7,
}

export const size = (value: string | object) => {
    if (typeof value === 'object') {
        value = JSON.stringify(value);
    }
    const size = Buffer.from(value).length;
    return size;
};
export const getFileName = (filePath: string): string => {
    const parts = filePath.split('/');
    const filename = parts[parts.length - 1];
    return filename.indexOf('.') !== -1 ? filename : '';
};

// https://stackoverflow.com/a/54387221
const readFilesRecursively = (
    dir: string,
    fileList: FileItem[],
    recursive: boolean
): FileItem[] => {
    const files = fs.readdirSync(dir);
    files.forEach((file: string) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            if (recursive === true) {
                readFilesRecursively(filePath, fileList, recursive);
                fileList.push({ path: filePath, type: 'folder' });
            }
        } else {
            fileList.push({ path: filePath, type: 'file' });
        }
    });
    return fileList;
};

export class FS {
    static exists = (path: string): boolean => {
        return fs.existsSync(path);
    };
    static hasFolder = FS.exists; // alias for consistency
    static hasFile = FS.exists; // alias for consistency
    static getFileName = getFileName;
    static createFolder(folder: string) {
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
    }
    static removeFolder(folder: string): void {
        if (fs.existsSync(folder)) {
            fs.rmSync(folder, { recursive: true, force: true });
        }
    }
    static getFolder(file: string): string {
        const parts = file.split('/');
        const filename = parts[parts.length - 1];
        const replaceable = filename.indexOf('.') !== -1 ? filename : '';
        const folder = file.replace(replaceable, '');
        return folder.replace(/\/$/, ''); // Remove trailing slash if exists
    }
    static getFirstFolder(file: string) {
        const folder = FS.getFolder(file);
        const folderParts = folder.split('/').filter((name) => name !== '');
        return folderParts.length > 0 ? folderParts[0] : '';
    }
    static moveFolder(oldFolder: string, newFolder: string): void {
        if (!FS.hasFolder(oldFolder)) {
            LOG.WARN(`Old folder does not exist: ${oldFolder}`);
            return;
        }
        if (!FS.hasFolder(newFolder)) {
            FS.createFolder(newFolder);
        }
        fs.renameSync(oldFolder, newFolder);
    }
    static readFile(path: string, options: any = {}) {
        options['encoding'] = 'utf8';

        try {
            // , { flag: 'wx' }
            const fileStream = fs.readFileSync(path);

            let str = fileStream.toString();
            return str;
        } catch (error: any) {
            LOG.FAIL(`[FS] readFile: ${error}`);
        }
    }
    static writeFile(
        path: string,
        rawData: string | object,
        option = 'replace',
        createDirectory = true
    ) {
        const folder = FS.getFolder(path);

        const data: string =
            typeof rawData === 'string'
                ? rawData
                : JSON.stringify(rawData, null, 4);
        const options = option === 'attach' ? { flag: 'a+' } : {};
        if (createDirectory) {
            if (!FS.hasFolder(folder)) {
                FS.createFolder(folder);
            }
            fs.writeFileSync(path, data, options);
        } else {
            // TODO: stabilize
            if (FS.hasFolder(folder)) {
                LOG.WARN(`Folder already exists: ${folder}`);
                fs.writeFileSync(path, data, options);
            }
        }
    }

    static removeFile(filePath: string): void {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    static list(path: string, recursive = true, fullPath = true): string[] {
        if (!fs.existsSync(path)) {
            LOG.WARN(`[FS] Path ${path} does not exist.`);
            return [];
        }
        let result: string[] = readFilesRecursively(path, [], recursive)
            .filter((file: FileItem) => file.type === 'file')
            .map((file: FileItem) =>
                fullPath ? file.path : getFileName(file.path)
            );
        return result;
    }

    static size(file: string): number {
        const content = FS.readFile(file) || '';
        return size(content);
    }
}