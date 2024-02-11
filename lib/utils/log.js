import { promises as fs } from 'fs';
import path from 'path';
import { getDirname } from '../utils.js';

// Define a default log path
const defaultLogPath = 'default.log';

const currentDir = path.dirname(getDirname(import.meta.url));

export async function Log(content, fileName = defaultLogPath) {
    try {
        // Get the actual directory path
        const dirPath = path.resolve(currentDir, '../../logs');

        // Ensure the directory exists (create if it doesn't)
        await fs.mkdir(dirPath, { recursive: true });

        // Construct the file path
        const filePath = path.join(dirPath, fileName);

        // Append the content to the file, creating the file if it doesn't exist
        await fs.appendFile(filePath, content + '\n');
    } catch (error) {
        originalConsole.error(`Failed to log content: ${error.message}`);
    }
}
