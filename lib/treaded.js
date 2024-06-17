import fs from 'fs';
import path from 'path';
import { Extension } from './extension.js';
import { readExtensionMetaData, verExtensionMateData } from './extensionMetadata.js';
import CryptoJS from 'crypto-js';
import md5 from 'js-md5';
import chalk from 'chalk'; // Import chalk for colored console output

/**
 * @typedef {import("./extension").default} ExtensionType
 */

global.window = global;
global.Extension = Extension;
global.CryptoJS = CryptoJS;
global.md5 = md5;

export default async function testExtension({ file, dir }) {
    const filePath = path.resolve(dir, file);
    const script = fs.readFileSync(filePath, 'utf8');
    const extensionData = readExtensionMetaData(script);

    const module = await import(path.resolve(dir, file));

    if (!module?.default) {
        throw new Error(`No default export in ${file}`);
    }
    if (!verExtensionMateData(extensionData)) {
        throw new Error(`Invalid metadata in ${file}`);
    }

    const extensionName = extensionData.name;
    console.log(chalk.yellow(`Testing ${extensionName}...`));

    const startTime = process.hrtime(); // Start time for execution measurement

    const result = {
        extension: extensionData.package,
        timestamp: new Date().toISOString(),
    };

    try {
        /**
         * @type {ExtensionType}
         */
        const extension = new module.default();

        Object.assign(extension, extensionData);

        await extension.load();

        const latest = await extension.latest(1);
        result.latest = latest.length > 0;

        const search = await extension.search('a', 1);
        result.search = search.length > 0;

        const testUrl = latest[0]?.url || search[0]?.url;
        const detail = await extension.detail(testUrl);
        result.detail = !!detail;

        const watch = await extension.watch(detail.episodes[0].urls[0].url);
        result.watch = !!watch;

        result.status = 'pass';
    } catch (error) {
        console.error(chalk.red(`Error testing ${extensionName}: ${error.message}`));
        result.status = 'fail';
        result.error = error.message;
    }

    const endTime = process.hrtime(startTime); // End time for execution measurement
    const executionTime = (endTime[0] + endTime[1] / 1e9).toFixed(3); // Calculate execution time in seconds

    console.log(chalk.cyan(`Finished testing ${extensionName}. Execution time: ${executionTime}s`));

    return {
        ...result,
        executionTime: parseFloat(executionTime), // Include execution time in result
    };
}
