import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import "./console.js";
import testExtension from './testExtension.js'; // Assuming your testExtension function is in a separate file
import { getDirname } from './utils.js';

async function testAllExtensions() {
    const dir = path.resolve(getDirname(import.meta.url), '../repo');
    const files = fs.readdirSync(dir);
    const extensions = [];

    for (const file of files) {
        extensions.push({ file, dir });
    }


    const results = [];
    let passed = 0;
    global.totalExtensions = extensions.length + 1;
    const startTimeTotal = process.hrtime();

    originalConsole.log(chalk.yellow(`Testing ${extensions.length} extensions...`));

    for (const [index, extension] of extensions.entries()) {
        try {
            const result = await testExtension(extension, index);
            results.push(result);

            if(result.status === "pass") {
                passed++;
            }
        } catch (error) {
            originalConsole.error(chalk.red(`Error testing extension: ${error.message}`));
        }
    }

    const endTimeTotal = process.hrtime(startTimeTotal);
    const totalTime = (endTimeTotal[0] + endTimeTotal[1] / 1e9).toFixed(3);

    originalConsole.log(chalk.cyan(`Total extensions: ${extensions.length}, Passed: ${passed}, Failed: ${extensions.length - passed}`));
    originalConsole.log(chalk.green(`All extensions tested. Total execution time: ${totalTime}s`));

    return results;
}


// Example usage:
testAllExtensions().then((results) => {
     fs.writeFileSync('./results.json', JSON.stringify(results));
}).catch(error => {
    originalConsole.error(chalk.red(`Error testing extensions: ${error.message}`));
});
