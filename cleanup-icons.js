// cleanup-icons.js

const fs = require('fs');
const path = require('path');

/**
 * Configuration flag to safe-guard against accidental deletions.
 * Set to `true` to preview files that would be deleted.
 * Set to `false` to actually perform the deletion.
 * @constant {boolean}
 */
const DRY_RUN = false;

const PROJECT_ROOT = __dirname;
const ICON_MAP_PATH = path.join(PROJECT_ROOT, 'src/sidebar/view/iconMap.ts');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets/filetype');
const ICONS_DIR = path.join(PROJECT_ROOT, 'assets/icons');

/**
 * List of filenames that must be preserved strictly.
 * These are essential assets that might not be explicitly referenced in the icon map.
 * @constant {string[]}
 */
const SAFE_LIST = [
    'icon.svg',                      // Main extension icon defined in package.json
    'default_file.svg',              // Fallback file icon
    'default_folder.svg',            // Fallback folder icon
    'default_folder_opened.svg',     // Fallback opened folder icon
    'default_root_folder.svg',       // Root folder icon
    'default_root_folder_opened.svg',// Root opened folder icon
    'file_type_light_config.svg'     // Manual exception for complex regex misses
];

/**
 * Recursively scans a directory and retrieves all SVG files.
 * * @param {string} dir - The directory path to scan.
 * @returns {string[]} An array of absolute file paths to .svg files.
 */
function getAllSvgFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllSvgFiles(filePath));
        } else {
            if (file.endsWith('.svg')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

// --- Main Execution ---

// 1. Validate Icon Map existence
if (!fs.existsSync(ICON_MAP_PATH)) {
    console.error(`ERROR: Could not find ${ICON_MAP_PATH}`);
    process.exit(1);
}

const mapContent = fs.readFileSync(ICON_MAP_PATH, 'utf8');

// 2. Extract used icon names
// Matches patterns like 'file_type_xxx', "folder_type_yyy", or 'default_zzz'
const usedIcons = new Set();
const regex = /['"]((?:file_type_|folder_type_|default_)[a-zA-Z0-9_\-]+)['"]/g;
let match;

while ((match = regex.exec(mapContent)) !== null) {
    const iconName = match[1];
    
    usedIcons.add(iconName + '.svg');

    // Important: If it is a folder icon, automatically whitelist the "_opened" variant
    // as VS Code file trees typically require the pair.
    if (iconName.startsWith('folder_type_')) {
        usedIcons.add(iconName + '_opened.svg');
    }
}

// Merge Safe List into the used set
SAFE_LIST.forEach(item => usedIcons.add(item));

console.log(`🔍 Found ${usedIcons.size} unique icon references (including variants and safe-list).`);

// 3. Collect all existing assets
const allFiles = [
    ...getAllSvgFiles(ASSETS_DIR),
    ...getAllSvgFiles(ICONS_DIR)
];

console.log(`📂 Total SVG files found in assets: ${allFiles.length}`);

// 4. Compare and Clean
let deletedCount = 0;
let keptCount = 0;

console.log('---------------------------------------------------');
allFiles.forEach(filePath => {
    const fileName = path.basename(filePath);

    if (usedIcons.has(fileName)) {
        keptCount++;
    } else {
        if (DRY_RUN) {
            console.log(`[DRY-RUN] Would delete: ${fileName}`);
        } else {
            try {
                fs.unlinkSync(filePath);
                console.log(`[DELETED] ${fileName}`);
            } catch (err) {
                console.error(`[ERROR] Failed to delete ${fileName}: ${err.message}`);
            }
        }
        deletedCount++;
    }
});

console.log('---------------------------------------------------');
console.log(`Final Status:`);
console.log(`✅ Kept    : ${keptCount} files`);
console.log(`🗑️  Deleted : ${deletedCount} files`);

if (DRY_RUN) {
    console.log('\n📢 DRY-RUN MODE: No files were deleted.');
    console.log('Set "const DRY_RUN = false" in the script to execute deletion.');
} else {
    console.log('\n✨ Cleanup completed successfully.');
}