import fs from 'fs';
import path from 'path';
import { getDirname } from './utils.js';

/**
 * @typedef {import("./types").ExtensionSettings} ExtensionSettings
 **/  



const settingsPath = path.resolve(getDirname(import.meta.url), 'settings.db.json');
 
/**
 * Read settings from the JSON file.
 * @param {string} packageName The package name of the extension.
 * @returns {Object<Array<Array<ExtensionSettings[]>>>} The settings object.
 */
async function readSettings(packageName) {
    try {
        const data = await fs.readFileSync(settingsPath, 'utf8') || '{}';
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading settings for ${packageName}: ${error}`);
        return {};
    }
}

/**
 * Write settings to the JSON file.
 * @param {string} packageName The package name of the extension.
 * @param {Object} settings The settings object.
 * @returns {void}
 */
async function writeSettings(packageName, settings) {
    try {
        const data = await JSON.stringify(settings, null, 2);
        await fs.writeFileSync(settingsPath, data, { flag: 'w' });
    } catch (error) {
        console.error(`Error writing settings for ${packageName}: ${error}`);
    }
}


/**
 * @namespace ExtensionSettingsDB
 */
export const ExtensionSettingsDB = {
    /**
     * Retrieves extension settings by package name.
     * @param {string} packageName - The package name of the extension settings to retrieve.
     * @returns {Promise<ExtensionSettings[]>}
     */
    get: async (packageName) => {
        const settings = await readSettings(packageName);
        return settings[packageName] || [];
    },

    /**
     * Retrieves extension settings by package name and key.
     * @param {string} packageName - The package name of the extension settings to retrieve.
     * @param {string} key - The key of the extension settings to retrieve.
     * @returns {Promise<ExtensionSettings>}
     */
    getByKey: async (packageName, key) => {
        const settings = await readSettings(packageName);
        if (!settings[packageName]) {
            settings[packageName] = {};
        }
        return settings[packageName][key]; 
    },

    /**
     * Sets the value of an extension setting.
     * @param {string} packageName - The package name of the extension.
     * @param {string} key - The key of the extension setting.
     * @param {string | boolean} value - The value to set.
     * @returns {Promise<boolean>}
     */
    set: async (packageName, key, value) => {
        const settings = await readSettings(packageName);
        const packageSettings = settings[packageName] || [];
        const settingIndex = await packageSettings.findIndex(setting => setting.key === key);

        if (settingIndex !== -1) {
            packageSettings[settingIndex].value = value;
        } else {
            await packageSettings.push({ key, value });
        }

        settings[packageName] = packageSettings;
        await writeSettings(packageName,settings);
        return true;
    },

    /**
     * Adds or modifies extension settings.
     * @param {ExtensionSettings} settingsToAdd - The extension settings to add or modify.
     * @returns {Promise<boolean>}
     */
    add: async (settingsToAdd) => {
        const settings = await readSettings();
        if (!settings[settingsToAdd.package]) {
            settings[settingsToAdd.package] = {};
        }
        settings[settingsToAdd.package][settingsToAdd.key] = settingsToAdd;
        await writeSettings(settingsToAdd.package,settings);
        return true;
    },

    /**
     * Deletes extension settings by package name.
     * @param {string} packageName - The package name of the extension settings to delete.
     * @returns {Promise<number>}
     */
    deleteExtension: async (packageName) => {
        const settings = await readSettings(packageName);
        delete settings[packageName];
        await writeSettings(packageName, settings);
        return true;
    }
};