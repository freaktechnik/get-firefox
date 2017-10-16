/**
 * @license MPL-2.0
 * @todo win zips vs. installers
 * @todo verify checksum file signature...
 * @todo fennec nightly via mdu
 * @module get-firefox
 */

"use strict";

const fs = require("fs"),
    sha = require("sha"),
    decompress = require("decompress"),
    fetch = require("node-fetch"),

    MDUContainer = require("./lib/mdu-container"),
    ClassicContainer = require("./lib/classic-container"),
    TaskclusterContainer = require("./lib/taskcluster-container"),

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

    PLATFORMS = require("./lib/platforms.json"),
    CONTAINERS = [
        ClassicContainer,
        MDUContainer,
        TaskclusterContainer
    ],

    normalizeSystem = (system) => {
        if(!system || !(system in PLATFORMS)) {
            const defaultPlatform = exports.getDefaultSystem();
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
    }));

/**
 * Save a stream to disk.
 *
 * @param {string} target - File name in the local system.
 * @param {Stream} stream - Stream to save to disk.
 * @async
 * @throws If writing the stream fails.
 * @returns {string} Path the file was written to as soon as the file is written.
 */
exports.writeFile = (target, stream) => new Promise((resolve, reject) => {
    const outputStream = fs.createWriteStream(target);
    outputStream.on('error', (e) => {
        reject(e);
        stream.unpipe(outputStream);
        outputStream.end();
    });
    outputStream.on('finish', () => resolve(target));
    stream.pipe(outputStream);
});

/**
 * Get the best-matching system for the current operating system, falling back
 * to Linux.
 *
 * @returns {string} Best matching operating system name.
 */
exports.getDefaultSystem = function() {
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
};

/**
 * Get the container to pass to the other methods based on system and arch.
 *
 * @param {string} branch - Firefox release branch.
 * @param {string} system - System name.
 * @param {string} [arch] - Architecture name.
 * @returns {module:get-firefox~Container} The container to describe the Firefox
 *                                          to download.
 */
exports.getContainer = function(branch, system, arch) {
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
};

/**
 * Download Firefox to a target location.
 *
 * @param {module:get-firefox~Container} container - File downloading container..
 * @async
 * @throws Whenever something goes wrong. No guaranteed type.
 * @returns {Object} Resolves as soon as the file is written.
 */
exports.downloadFirefox = function(container) {
    return container.getFileURL().then((url) => fetch(url))
        .then((response) => {
            if(response.ok) {
                return response.body;
            }

            throw new Error(`Could not download Firefox: ${response.statusText}`);
        });
};

/**
 * Check the checksum of a local file.
 *
 * @param {Stream} fileStream - Stream of the downloaded file.
 * @param {string} targetName - Name of the remote file.
 * @param {string} sum - Checksum the file should match.
 * @async
 * @returns {Stream} A Stream that errors if the hash does not match.
 */
exports.check = function(fileStream, targetName, sum) {
    return calculateChecksum(fileStream, getFileChecksum(targetName, sum));
};

/**
 * Extract a Firefox archive.
 *
 * @param {Buffer} file - File to extract.
 * @param {string} [targetDir="."] - Directory to extract into. Defaults to the CWD.
 * @async
 * @throws When decompression fails
 * @returns {?} As soon as decompression is done.
 */
exports.extract = function(file, targetDir) {
    targetDir = targetDir || ".";
    return decompress(file, targetDir);
};
