import { dirname } from 'path';
import { fileURLToPath } from 'url';

export const getDirname = (metaUrl) => {
    return dirname(fileURLToPath(metaUrl));
};