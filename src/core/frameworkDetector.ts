// src/core/frameworkDetector.ts
import * as fs from 'fs';
import { FRAMEWORKS, FrameworkDefinition } from './frameworks';

/**
 * Identifies the development framework of a project by inspecting its root directory for key configuration files.
 * * This function iterates through a prioritized list of framework definitions. It checks for specific
 * file triggers (strings or regular expressions) to determine the best match.
 * * @param rootPath - The absolute filesystem path to the project's root directory.
 * @returns The {@link FrameworkDefinition} of the detected framework, or `undefined` if no match is found.
 */
export function detectFramework(rootPath: string): FrameworkDefinition | undefined {
    const sortedFrameworks = [...FRAMEWORKS].sort((a, b) => b.priority - a.priority);

    for (const framework of sortedFrameworks) {
        const isMatch = checkTriggers(rootPath, framework.triggers);
        if (isMatch) {
            return framework;
        }
    }

    return undefined;
}

/**
 * Scans a directory to determine if any of the provided framework triggers are present.
 * * @param rootPath - The absolute path of the directory to scan.
 * @param triggers - An array of filenames (strings) or patterns (RegExp) to look for.
 * @returns `true` if at least one trigger matches a file in the directory; otherwise, `false`.
 */
function checkTriggers(rootPath: string, triggers: (string | RegExp)[]): boolean {
    try {
        const files = fs.readdirSync(rootPath);

        for (const trigger of triggers) {
            if (typeof trigger === 'string') {
                if (files.some(f => f.toLowerCase() === trigger.toLowerCase())) {
                    return true;
                }
            } else if (trigger instanceof RegExp) {
                if (files.some(f => trigger.test(f))) {
                    return true;
                }
            }
        }
    } catch (error) {
        console.error('Error reading directory for framework detection:', error);
    }
    
    return false;
}