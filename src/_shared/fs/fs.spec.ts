import { FS, Status, getFileName, size } from './fs';
import * as fs from 'fs';
import * as mock from 'mock-fs';
import { LOG } from '../log/log';
// let PATH = `${BASE}/tmp/foo`;

const checkChanges = (originalFileContent: string | null, file: string) => {
    const exists = fs.existsSync(file);
    if (!originalFileContent && exists) {
        return { status: Status.CREATED, file };
    } else if (originalFileContent && exists) {
        const currentFileContent = fs.readFileSync(file, 'utf8');
        if (currentFileContent === originalFileContent) {
            return { status: Status.NO_CHANGES, file };
        } else {
            if (currentFileContent.includes(originalFileContent)) {
                return { status: Status.EXTENDED, file };
            } else {
                return { status: Status.OVERWRITTEN, file };
            }
        }
    } else if (originalFileContent && !exists) {
        return { status: Status.REMOVED, file };
    } else {
        return { status: Status.NOT_EXISTS, file };
    }
};
const getFileContent = (file: string) => {
    return fs.readFileSync(`${file}`).toString();
};
const isExisting = (file: string) => {
    return fs.existsSync(file);
};
describe('getFileName()', () => {
    it('should return from path', () => {
        expect(getFileName('tmp/foo/bar/file.txt')).toEqual('file.txt');
    });
    it('should return from path', () => {
        expect(getFileName('file.txt')).toEqual('file.txt');
    });
    it('should return from path', () => {
        expect(getFileName('')).toEqual('');
    });
});

describe('test FS', () => {
    beforeEach(() => {
        mock.restore();
        mock({
            tmp: {
                'file.txt': 'xx',
                'file.json': '{ "xxx": 2}',
                'invalidKey.json': `{ xxx: 2, "yyy": "foobar", bla: "blubber", holsten: { "bla": "kosten"}}`,
            },
            tmpEmpty: {},
        });
    });
    afterEach(() => {
        mock.restore();
        jest.clearAllMocks();
        // readline.cursorTo(process.stdout, 0);
    });
    describe('fileExists()', () => {
        describe('with normal path', () => {
            it('should return true for existing file', () => {
                expect(FS.exists('tmp/file.txt')).toEqual(true);
            });
            it('should return false for non-existing file', () => {
                expect(FS.exists('tmp/notexists.txt')).toEqual(false);
            });
            it('should return false for non-existing folder', () => {
                expect(FS.exists('tmp/notexists')).toEqual(false);
            });
            it('should return true for existing folder', () => {
                expect(FS.exists('tmp')).toEqual(true);
            });
        });
        describe('with relative path', () => {
            it('should return true for existing file with relative path', () => {
                expect(FS.exists('./tmp/file.txt')).toEqual(true);
            });
            it('should return false for non-existing file with relative path', () => {
                expect(FS.exists('./tmp/notexists.txt')).toEqual(false);
            });
            it('should return false for non-existing folder with relative path', () => {
                expect(FS.exists('./tmp/notexists')).toEqual(false);
            });
            it('should return true for existing folder with relative path', () => {
                expect(FS.exists('./tmp')).toEqual(true);
            });
        });
        describe('with absolute path', () => {
            const CWD = process.cwd();
            it('should return true for existing file with absolute path', () => {
                expect(FS.exists(`${CWD}/tmp/file.txt`)).toEqual(true);
            });
            it('should return false for non-existing file with absolute path', () => {
                expect(FS.exists(`${CWD}/tmp/notexists.txt`)).toEqual(false);
            });
            it('should return false for non-existing folder with absolute path', () => {
                expect(FS.exists(`${CWD}/tmp/notexists`)).toEqual(false);
            });
            it('should return true for existing folder with absolute path', () => {
                expect(FS.exists(`${CWD}/tmp`)).toEqual(true);
            });
        });
    });
    describe('getFileName()', () => {
        it('should return the file name from a path', () => {
            expect(FS.getFileName('tmp/foo/bar/file.txt')).toEqual('file.txt');
        });
    });
    describe('createFolder()', () => {
        const TEST_FOLDER: string = 'testFolder';
        it('creation of existing a folder', () => {
            mock({ testFolder: {} });
            expect(isExisting(TEST_FOLDER)).toEqual(true);
            FS.createFolder(TEST_FOLDER);
            expect(isExisting(TEST_FOLDER)).toEqual(true);
        });
        it('creation of a new folder', () => {
            expect(isExisting(TEST_FOLDER)).toEqual(false);
            FS.createFolder(TEST_FOLDER);
            expect(isExisting(TEST_FOLDER)).toEqual(true);
        });
    });
    describe('removeFolder()', () => {
        const TEST_FOLDER: string = 'testFolder';
        it('removal of an empty folder', () => {
            mock({ testFolder: {} });
            expect(isExisting(TEST_FOLDER)).toEqual(true);
            FS.removeFolder(TEST_FOLDER);
            expect(isExisting(TEST_FOLDER)).toEqual(false);
        });
        it('removal of a not empty folder without recursive', () => {
            mock({
                testFolder: {
                    'text.md': 'var',
                },
            });
            expect(isExisting(TEST_FOLDER)).toEqual(true);
            FS.removeFolder(TEST_FOLDER);
            expect(isExisting(TEST_FOLDER)).toEqual(false);
        });
        it('removal of a non existing folder', () => {
            const NON_EXISTING_FOLDER = 'notexisting';
            expect(isExisting(NON_EXISTING_FOLDER)).toEqual(false);
            FS.removeFolder(NON_EXISTING_FOLDER);
            expect(isExisting(NON_EXISTING_FOLDER)).toEqual(false);
        });
        it('removal of a not empty folder with recursive', () => {
            mock({
                testFolder: {
                    'text.md': 'var',
                },
            });
            expect(isExisting(TEST_FOLDER)).toEqual(true);
            FS.removeFolder(TEST_FOLDER);
            expect(isExisting(TEST_FOLDER)).toEqual(false);
        });
    });
    describe('getFolder()', () => {
        const TEST_FOLDER: string = 'testFolder';
        it('get folder of an existing file', () => {
            mock({ testFolder: { 'text.md': 'var' } });
            expect(isExisting(TEST_FOLDER)).toEqual(true);
            const folder = FS.getFolder(`${TEST_FOLDER}/text.md`);
            expect(folder).toEqual(TEST_FOLDER);
        });
        it('get folder of an existing folder', () => {
            const EXISTING_FOLDER = 'tmp';
            expect(isExisting(EXISTING_FOLDER)).toEqual(true);
            const folder = FS.getFolder(EXISTING_FOLDER);
            expect(folder).toEqual(EXISTING_FOLDER);
        });
        it('get folder of a non existing file', () => {
            const NON_EXISTING_FILE = 'notexisting/text.md';
            expect(isExisting(NON_EXISTING_FILE)).toEqual(false);
            const folder = FS.getFolder(NON_EXISTING_FILE);
            expect(folder).toEqual('notexisting');
        });
        it('get folder of an empty path', () => {
            const EMPTY_PATH = '';
            const folder = FS.getFolder(EMPTY_PATH);
            expect(folder).toEqual('');
        });
    });
    describe('getFirstFolder()', () => {
        it('should return the first folder of a file path', () => {
            const filePath = 'tmp/foo/bar/file.txt';
            const firstFolder = FS.getFirstFolder(filePath);
            expect(firstFolder).toEqual('tmp');
        });
        it('should return the first folder of a folder path', () => {
            const folderPath = 'tmp/foo/bar/';
            const firstFolder = FS.getFirstFolder(folderPath);
            expect(firstFolder).toEqual('tmp');
        });
        it('should return an empty string for an empty path', () => {
            const emptyPath = '';
            const firstFolder = FS.getFirstFolder(emptyPath);
            expect(firstFolder).toEqual('');
        });
    });
    describe('moveFolder()', () => {
        const OLD_FOLDER: string = 'oldFolder';
        const NEW_FOLDER: string = 'newFolder';
        beforeEach(() => {
            mock({ oldFolder: { 'text.md': 'var' } });
        });
        it('should move an existing folder to a new location', () => {
            expect(isExisting(OLD_FOLDER)).toEqual(true);
            FS.moveFolder(OLD_FOLDER, NEW_FOLDER);
            expect(isExisting(OLD_FOLDER)).toEqual(false);
            expect(isExisting(NEW_FOLDER)).toEqual(true);
        });
        it('should not throw an error if the old folder does not exist', () => {
            const NON_EXISTING_FOLDER = 'notexisting';
            expect(isExisting(NON_EXISTING_FOLDER)).toEqual(false);
            FS.moveFolder(NON_EXISTING_FOLDER, NEW_FOLDER);
            expect(isExisting(NON_EXISTING_FOLDER)).toEqual(false);
            expect(isExisting(NEW_FOLDER)).toEqual(false);
        });
    });
    describe('readFile()', () => {
        it('should read a file with utf8 encoding', () => {
            const content = FS.readFile('tmp/file.txt');
            expect(content).toEqual('xx');
        });
        it('should read a file of unknown', () => {
            const content = FS.readFile('unknown/file.txt');
            expect(content).toEqual(undefined);
        });
        it('should read a file with invalid JSON key and parse it', () => {
            const content = FS.readFile('tmp/invalidKey.json');
            const EXPECTED =
                '{ xxx: 2, "yyy": "foobar", bla: "blubber", holsten: { "bla": "kosten"}}';
            expect(content).toEqual(EXPECTED);
        });
    });
    describe('writeFile', () => {
        // TODO: json
        const FILE = `tmp/CREATE_FILE.txt`;
        let currentFileContent: string | any = null;
        beforeEach(() => {
            currentFileContent = FS.exists(FILE) ? FS.readFile(FILE) : null;
        });
        afterEach(() => {
            currentFileContent = null;
        });
        it('create file', () => {
            FS.writeFile(`${FILE}`, 'xxx');
            const result = checkChanges(currentFileContent, FILE);
            expect(result.status).toEqual(Status.CREATED);
            expect(fs.readFileSync(`${FILE}`).toString()).toEqual('xxx');
        });
        it('create file in new directory', () => {
            mock({});
            FS.writeFile(`${FILE}`, 'xxx');
            const result = checkChanges(currentFileContent, FILE);
            expect(result.status).toEqual(Status.CREATED);
            expect(fs.readFileSync(`${FILE}`).toString()).toEqual('xxx');
        });
        it('create file in new directory', () => {
            const NEW_FILE = `tmp/NEW_DIR/CREATE_FILE.txt`;
            FS.writeFile(`${NEW_FILE}`, 'xxx', 'replace', false);
            const result = checkChanges(currentFileContent, NEW_FILE);
            expect(result.status).toEqual(Status.NOT_EXISTS);
            expect(FS.readFile(`${NEW_FILE}`)).toEqual(undefined);
        });
        it('create file', () => {
            FS.writeFile(`${FILE}`, { xxx: 2 });
            const result = checkChanges(currentFileContent, FILE);
            expect(result.status).toEqual(Status.CREATED);
            expect(FS.readFile(`${FILE}`)).toEqual('{\n    "xxx": 2\n}');
        });
        it('create file', () => {
            FS.writeFile(`${FILE}`, 'xxx', 'replace', false);
            const result = checkChanges(currentFileContent, FILE);
            expect(result.status).toEqual(Status.CREATED);
            expect(FS.readFile(`${FILE}`)).toEqual('xxx');
        });
        it('overwrite file', () => {
            FS.writeFile(`${FILE}`, 'xxx');
            currentFileContent = getFileContent(FILE);
            expect(currentFileContent).toEqual('xxx');

            FS.writeFile(`${FILE}`, 'yyy');
            const result = checkChanges(currentFileContent, FILE);
            expect(result.status).toEqual(Status.OVERWRITTEN);
            expect(FS.readFile(`${FILE}`)).toEqual('yyy');
        });
        it('extend file', () => {
            FS.writeFile(`${FILE}`, 'xxx');
            currentFileContent = getFileContent(FILE);
            expect(currentFileContent).toEqual('xxx');

            FS.writeFile(`${FILE}`, 'yyy', 'attach');
            const result = checkChanges(currentFileContent, FILE);
            expect(result.status).toEqual(Status.EXTENDED);
            expect(fs.readFileSync(`${FILE}`).toString()).toEqual('xxxyyy');
        });
        xit('errors', () => {});
    });
    describe('removeFile()', () => {
        const FILE = `tmp/CREATE_FILE.txt`;
        beforeEach(() => {
            mock({ tmp: { 'CREATE_FILE.txt': 'xx' } });
        });
        afterEach(() => {
            mock.restore();
        });
        it('should remove an existing file', () => {
            expect(isExisting(FILE)).toEqual(true);
            FS.removeFile(FILE);
            expect(isExisting(FILE)).toEqual(false);
        });
        it('should not throw an error if the file does not exist', () => {
            const NON_EXISTING_FILE = 'tmp/notexists.txt';
            expect(isExisting(NON_EXISTING_FILE)).toEqual(false);
            FS.removeFile(NON_EXISTING_FILE);
            expect(isExisting(NON_EXISTING_FILE)).toEqual(false);
        });
    });
    describe('list', () => {
        beforeEach(() => {
            mock.restore();
            mock({
                tmp: {
                    'file.txt': 'xx',
                    'file.json': '{ "xxx": 2}',
                },
                foo: {
                    'file.txt': 'xx',
                    bar: {
                        'file.txt': 'xx',
                    },
                },
                tmpEmpty: {},
            });
        });
        describe('should return list of files', () => {
            it('from sub-folder [absolute path, recursive=true]', () => {
                const EXPECTED = ['tmp/file.json', 'tmp/file.txt'];
                expect(FS.list(`tmp`)).toEqual(EXPECTED);
                expect(FS.list(`tmp/`)).toEqual(EXPECTED);
            });
            it('from sub-folder with sub-folder [absolute path, recursive=true]', () => {
                const EXPECTED = ['foo/bar/file.txt', 'foo/file.txt'];
                expect(FS.list(`foo`)).toEqual(EXPECTED);
                expect(FS.list(`foo/`)).toEqual(EXPECTED);
            });
            it('from sub-folder with sub-folder [relative path, recursive=true]', () => {
                const EXPECTED = ['file.txt', 'file.txt'];
                expect(FS.list(`foo`, true, false)).toEqual(EXPECTED);
                expect(FS.list(`foo/`, true, false)).toEqual(EXPECTED);
            });

            it('from sub-folder [relative path, recursive=false]', () => {
                const EXPECTED = ['file.json', 'file.txt'];
                expect(FS.list(`tmp`, true, false)).toEqual(EXPECTED);
                expect(FS.list(`tmp/`, true, false)).toEqual(EXPECTED);
            });
            it('from root-Folder [absolute path, recursive=true]', () => {
                const EXPECTED: string[] = [
                    'foo/bar/file.txt',
                    'foo/file.txt',
                    'tmp/file.json',
                    'tmp/file.txt',
                ];
                expect(FS.list(`./`)).toEqual(EXPECTED);
                expect(FS.list(``)).toEqual(EXPECTED);
            });
            it('from "tmp"-Folder recursively', () => {
                const EXPECTED = ['file.json', 'file.txt'];
                expect(FS.list(`tmp`, true, false)).toEqual(EXPECTED);
            });
            it('should return list of files from foo-Folder not recursively', () => {
                const EXPECTED = ['foo/file.txt'];
                expect(FS.list(`./foo`, false)).toEqual(EXPECTED);
                expect(FS.list(`foo/`, false)).toEqual(EXPECTED);
            });
        });
        describe('should return empty list of files', () => {
            it('from root-Folder [absolute path, recursive=false]', () => {
                const EXPECTED: string[] = [];
                expect(FS.list(`./`, false)).toEqual(EXPECTED);
                expect(FS.list(``, false)).toEqual(EXPECTED);
            });
            it('should return empty list of files', () => {
                expect(FS.list(`tmpEmpty`)).toEqual([]);
                expect(FS.list(`tmpEmpty/`)).toEqual([]);
                expect(FS.list(`notexitss`)).toEqual([]);
                expect(FS.list(`note   xitss`)).toEqual([]);
            });
        });
        describe('errors', () => {
            it('should return empty list when path not exists and get CI info', () => {
                const logSpy = jest.spyOn(LOG, 'WARN');
                const EXPECTED: string[] = [];
                expect(FS.list(`nope`)).toEqual(EXPECTED);
                const logArg = logSpy.mock.calls[0][0];
                expect(logArg).toEqual(
                    expect.stringContaining('Path nope does not exist.')
                );
                logSpy.mockRestore();
            });
        });
    });
    describe('size', () => {
        it('size of file', () => {
            expect(FS.size(`notexitst`)).toEqual(0);
            expect(FS.size(`tmp/file.txt`)).toEqual(2);
            expect(FS.size(`tmp/file.json`)).toEqual(11);
        });
        it('size of content', () => {
            expect(size('A')).toEqual(1);
            expect(size('Ψ')).toEqual(2);
            expect(size('💾')).toEqual(4);
            expect(size({ xxx: 2 })).toEqual(9);
        });
    });
});