/**
 * @license MPL-2.0
 * @todo Win zips vs installers.
 * @todo Verify checksum file signature...
 * @todo Fennec nightly via mdu.
 * @module get-firefox
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
        TaskclusterContainer
    ],

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
        if(!file) {
            throw new Error("No checksums available");
        }
        else {
            let sum;
            file.split("\n").some((line) => {
                const [
                    s,
                    type,
                    b, // eslint-disable-line no-unused-vars
                    path
                ] = line.split(" ");
                if(type == "sha512" && path.split("/").pop() == filename) {
                    sum = s;
                    return true;
                }
                return false;
            });

            if(!sum) {
                throw new Error(`Could not find a checksum for ${filename}`);
            }
            else {
                return sum;
            }
        }
    },
    calculateChecksum = (stream, expected) => stream.pipe(sha.stream(expected, {
        algorithm: "sha512"
    })),

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

    /**
     * Get the container to pass to the other methods based on system and arch.
     *
     * @param {string} branch - Firefox release branch.
     * @param {string} system - System name.
     * @param {string} [arch] - Architecture name.
     * @returns {module:get-firefox~Container} The container to describe the Firefox
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
     * @param {module:get-firefox~Container} container - File downloading container..
     * @async
     * @throws Whenever something goes wrong. No guaranteed type.
     * @returns {object} Resolves as soon as the file is written.
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
     * @param {Buffer} buffer - Buffer of the downloaded file.
     * @param {string} targetName - Name of the remote file.
     * @param {string} sum - Checksum the file should match.
     * @async
     * @returns {Stream} A Stream that errors if the hash does not match.
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
     * @async
     * @throws When decompression fails.
     * @returns {any} As soon as decompression is done.
     */
    extract = (file, targetDirectory) => {
        targetDirectory = targetDirectory || ".";
        return decompress(file, targetDirectory);
    };

export { getDefaultSystem, getContainer, downloadFirefox, check, extract, PLATFORMS }
