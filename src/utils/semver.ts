// src/utils/semver.ts

/**
 * Compares two semantic version strings to determine if an update is available.
 * * This function handles standard semantic versioning formats (e.g., "1.0.0" vs "1.0.1")
 * and is robust against optional "v" prefixes (e.g., "v1.2.0").
 *
 * @param currentVersion - The version string of the currently installed extension.
 * @param remoteVersion - The version string obtained from the remote release source.
 * @returns `true` if the `remoteVersion` is greater than the `currentVersion`; otherwise, `false`.
 */
export function isNewerVersion(currentVersion: string, remoteVersion: string): boolean {
  const v1 = currentVersion.replace(/^v/, '').split('.').map(Number);
  const v2 = remoteVersion.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1 = v1[i] || 0;
    const num2 = v2[i] || 0;

    if (num2 > num1) {return true;}
    if (num2 < num1) {return false;}
  }
  return false;
}