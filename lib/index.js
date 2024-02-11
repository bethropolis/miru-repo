import fs from 'fs';
import path from 'path';
import { Extension } from './extension.js';
import { readExtensionMetaData, verExtensionMateData } from './extensionMetadata.js';
import { getDirname } from './utils.js';
import CryptoJS from 'crypto-js';
import md5 from 'js-md5';
import { exit } from 'process';

/**
 * @typedef {import("./extension").default} ExtensionType
 */

global.window = global;
global.Extension = Extension;
global.CryptoJS = CryptoJS;
global.md5 = md5;



async function testExtensions() {
    const dir = path.resolve(getDirname(import.meta.url), '../repo');;
    const files = fs.readdirSync(dir);
    const results = {};

    if (fs.existsSync('./lib/test.json')) {
        let previousResults = {};
        try{
            previousResults = JSON.parse(fs.readFileSync('./lib/test.json', 'utf8'));
        } catch (error) {
            previousResults = {};
        }
        Object.assign(results, previousResults);
    }

    for (const file of files) {
        const filePath = path.resolve(dir, file);
        const script = fs.readFileSync(filePath, 'utf8');
        const extensionData = readExtensionMetaData(script);

        const module = await import(path.resolve(dir, file));

        if (!module?.default) {
            console.error(`Error testing ${file}: No default export`);
            continue;
        }
        if (!verExtensionMateData(extensionData)) {
            console.error(`Error testing ${file}: Invalid metadata`);
            continue;
        }


         // Check if the last test was less than 24 hours ago
         const lastTest = results[extensionData.package]?.timestamp;
         if (lastTest && new Date() - new Date(lastTest) < 24 * 60 * 60 * 1000) {
             continue;
         }

         console.log(`Testing ${extensionData.name}...`);

        const result = {
            extension: extensionData.package,
            timestamp: new Date().toISOString(),
        };

        try{ 
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

            const detail = await extension.detail(latest[0].url);
            result.detail = !!detail;

            const watch = await extension.watch(detail.episodes[0].urls[0].url);
            result.watch = !!watch;
        } catch (error) {
            console.error(`Error testing ${extensionData.name}: ${error.message}`);
            result.error = error.message;
        }

        result.status = result.error ? 'fail' : 'pass';
        results[extensionData.package] = result;
    }

    console.log('%cWriting test results...','color: green;');
    fs.writeFileSync('./lib/test.json', JSON.stringify(results, null, 2), 'utf8');
}

testExtensions().catch(console.error);