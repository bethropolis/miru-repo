import fs from 'fs';
import path from 'path';
import { Extension } from './extension.js';
import { readExtensionMetaData, verExtensionMateData } from './extensionMetadata.js';
import CryptoJS from 'crypto-js';
import md5 from 'js-md5';

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

    console.log(`Testing ${extensionData.name}...`);

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
    } catch (error) {
        console.error(`Error testing ${extensionData.name}: ${error.message}`);
        result.error = error.message;
    }

    result.status = result.error ? 'fail' : 'pass';
    return result;
}
