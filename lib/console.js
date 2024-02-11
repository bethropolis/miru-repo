import { Log } from "./utils/log.js";
import path from "path";

/**
 * The original console object.
 * @global
 * @type {object}
 */
global.originalConsole = { ...console };

function getCallerInfo() {
  const err = new Error();
  const stack = err.stack || "";
  const stackLines = stack.split("\n");
  const callerLine = stackLines[4] || "";
  const match = callerLine.match(/\((.*?):\d+:\d+\)$/);
  return match ? match[1] : "Unknown";
}

function logWithCallerInfo(level, args) {
  const callerInfo = getCallerInfo();
  const fileName = callerInfo.includes("/repo/")
    ? path.basename(callerInfo) + ".log"
    : "default.log";
  Log(`[${level}] ${args.join(" ")}`, fileName);
}

/**
 * Overwrites the console.log method to log messages with a prefix.
 * @global
 * @param {...any} args - The arguments to be logged.
 */
global.console.log = (...args) => {
  logWithCallerInfo("LOG", args);
};

/**
 * Overwrites the console.error method to log error messages with a prefix.
 * @global
 * @param {...any} args - The arguments to be logged as an error.
 */
global.console.error = (...args) => {
  logWithCallerInfo("ERROR", args);
};

/**
 * Overwrites the console.warn method to log warning messages with a prefix.
 * @global
 * @param {...any} args - The arguments to be logged as a warning.
 */
global.console.warn = (...args) => {
  logWithCallerInfo("WARN", args);
};
