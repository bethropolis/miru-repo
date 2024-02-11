import fs from 'fs';
import path from 'path';
import { Extension } from './extension.js';
import { readExtensionMetaData, verExtensionMateData } from './extensionMetadata.js';
import CryptoJS from 'crypto-js';
import md5 from 'js-md5';
import chalk from 'chalk'; 
import axios from 'axios';


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
    originalConsole.log(chalk.yellow(`\n Testing ${extensionName}...`));

    const startTime = process.hrtime(); // Start time for execution measurement

    const result = {
        extension: extensionData.package,
        timestamp: new Date().toISOString(),
        loaded: false,
        connection: false,
        latest: false,
        search: false,
        detail: false,
        watch: false,
    };

    try {
        /**
         * @type {ExtensionType}
         */
        const extension = new module.default();

        Object.assign(extension, extensionData);

        await extension.load();
        result.loaded = true;

        try {
            // make a request to the base url to check if the connection is working
            const response = await axios.head(extension.webSite);
            result.connection = response.status === 200;
        } catch (error) {}

        originalConsole.log(extensionData, extension.webSite, response.status);

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
        originalConsole.error(chalk.red(`Error testing ${extensionName}: ${error.message}`));
        result.status = 'fail';
        result.error = error.message;
    }

    const endTime = process.hrtime(startTime); // End time for execution measurement
    const executionTime = (endTime[0] + endTime[1] / 1e9).toFixed(3); // Calculate execution time in seconds

    originalConsole.log(chalk.cyan(`Finished testing ${extensionName}. Execution time: ${executionTime}s \n`));

    return {
        ...result,
        executionTime: parseFloat(executionTime), // Include execution time in result
    };
}
