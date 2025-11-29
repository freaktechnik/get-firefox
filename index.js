/**
 * @module get-firefox
 * @license MPL-2.0
 * @todo Win zips vs installers.
 * @todo Verify checksum file signature...
 * @todo Fennec nightly via mdu.
 */
import fs from "node:fs/promises";
import sha from "sha";
import decompress from "decompress";
import fetch from "node-fetch";
import intoStream from "into-stream";

import MDUContainer from "./lib/mdu-container.js";
import ClassicContainer from "./lib/classic-container.js";
import TaskclusterContainer from "./lib/taskcluster-container.js";

/**
 * Container for all the logic to determine download URL, file name and
 * checksums for different kinds of sources.
 *
 * @interface Container
 */
/**
 * @function Container#getChecksums
 * @async
 */
/**
 * @function Container#getFileName
 * @async
 */
/**
 * @function Container#getFileURL
 * @async
 */

const PLATFORMS = JSON.parse(await fs.readFile(new URL("./lib/platforms.json", import.meta.url))),
    CONTAINERS = [
        ClassicContainer,
        MDUContainer,
        TaskclusterContainer,
    ],

    /**
     * Get the best-matching system for the current operating system, falling back
     * to Linux.
     *
     * @returns {string} Best matching operating system name.
     */
    getDefaultSystem = () => {
        switch(process.platform) {
        case "darwin":
            return "mac";
        case "win32":
            return "win";
        case "android":
            return "android";
        default:
            return "linux";
        }
    },

    normalizeSystem = (system) => {
        if(!system || !(system in PLATFORMS)) {
            const defaultPlatform = getDefaultSystem();
            if(system) {
                console.warn(`Unknown platform '${system}', defaulting to ${defaultPlatform}`);
            }
            return defaultPlatform;
        }

        return system;
    },
    normalizeBranch = (branch, system) => {
        if(!branch || !(branch in PLATFORMS[system].branches)) {
            if(branch) {
                console.warn(`Unknown branch '${branch}', defaulting to ${PLATFORMS[system].defaultBranch}`);
            }
            return PLATFORMS[system].defaultBranch;
        }

        return branch;
    },
    getDownloadInfo = (branch, system) => PLATFORMS[system].branches[branch],
    getFileChecksum = (filename, file) => {
        if(file) {
            let sum;
            file.split("\n").some((line) => {
                const [
                    s,
                    type,
                    b, // eslint-disable-line no-unused-vars
                    path,
                ] = line.split(" ");
                if(type == "sha512" && path.split("/").pop() == filename) {
                    sum = s;
                    return true;
                }
                return false;
            });

            if(sum) {
                return sum;
            }
            throw new Error(`Could not find a checksum for ${filename}`);
        }
        throw new Error("No checksums available");
    },
    calculateChecksum = (stream, expected) => stream.pipe(sha.stream(expected, {
        algorithm: "sha512",
    })),

    /**
     * Get the container to pass to the other methods based on system and arch.
     *
     * @param {string} branch - Firefox release branch.
     * @param {string} system - System name.
     * @param {string} [arch] - Architecture name.
     * @returns {Container} The container to describe the Firefox
     *                                          to download.
     */
    getContainer = (branch, system, arch) => {
        system = normalizeSystem(system);
        branch = normalizeBranch(branch, system);
        const spec = getDownloadInfo(branch, system),
            { type } = PLATFORMS[system].branches[branch],
            Constructor = CONTAINERS.find((c) => c.type == type);

        if(!(arch in spec.arches)) {
            if(arch) {
                console.warn(`There is no architecture ${arch} for ${system}, defaulting to ${spec.defaultArch}`);
            }
            arch = spec.defaultArch;
        }
        return new Constructor(spec.arches[arch]);
    },

    /**
     * Download Firefox to a target location.
     *
     * @param {Container} container - File downloading container..
     * @returns {object} Resolves as soon as the file is written.
     * @async
     * @throws Whenever something goes wrong. No guaranteed type.
     */
    downloadFirefox = async (container) => {
        const url = await container.getFileURL(),
            response = await fetch(url);
        if(response.ok) {
            return response.body;
        }

        throw new Error(`Could not download Firefox: ${response.statusText}`);
    },

    /**
     * Check the checksum of a local file.
     *
     * @param {Uint8Array|ArrayBuffer|TypedArray} buffer - Buffer of the downloaded file.
     * @param {string} targetName - Name of the remote file.
     * @param {string} sum - Checksum the file should match.
     * @returns {Stream} A Stream that errors if the hash does not match.
     * @async
     */
    check = (buffer, targetName, sum) => {
        const fileStream = intoStream(buffer);
        return calculateChecksum(fileStream, getFileChecksum(targetName, sum));
    },

    /**
     * Extract a Firefox archive.
     *
     * @param {Buffer} file - File to extract.
     * @param {string} [targetDirectory="."] - Directory to extract into. Defaults to the CWD.
     * @returns {any} As soon as decompression is done.
     * @async
     * @throws When decompression fails.
     */
    extract = (file, targetDirectory = ".") => decompress(file, targetDirectory);

export {
    getDefaultSystem, getContainer, downloadFirefox, check, extract, PLATFORMS,
};
