export type Filetype = 'file' | 'folder' | 'symlink' | 'other';
export type FileItem = { type: Filetype; path: string };
export type FileItems = FileItem[];