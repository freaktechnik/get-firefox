/**
 * @license MPL-2.0
 * @todo win zips vs. installers
 * @todo verify checksum file signature...
 * @todo fennec nightly via mdu
 * @module get-firefox
 */

"use strict";

const fs = require("fs"),
    Promise = require("any-promise"),
    checksum = require("checksum"),
    decompress = require("decompress"),
    fetch = require("node-fetch"),

    MDUContainer = require("./lib/mdu-container"),
    ClassicContainer = require("./lib/classic-container"),
    TaskclusterContainer = require("./lib/taskcluster-container"),

    /**
     * Container for all the logic do determine download URL, file name and
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
    /*
     * @function Container#getFileURL
     * @async
     */

    PLATFORMS = require("./lib/platforms.json"),
    CONTAINERS = [ ClassicContainer, MDUContainer, TaskclusterContainer ],

    normalizeSystem = (system) => {
        if(!system || !(system in PLATFORMS)) {
            const defaultPlatform = exports.getDefaultSystem();
            if(system) {

                console.warn("Unknown platform '" + system + "', defaulting to " + defaultPlatform);
            }
            return defaultPlatform;
        }
        else {
            return system;
        }
    },
    normalizeBranch = (branch, system) => {
        if(!branch || !(branch in PLATFORMS[system].branches)) {
            if(branch) {
                console.warn("Unknown branch '" + branch + "', defaulting to " + PLATFORMS[system].defaultBranch);
            }
            return PLATFORMS[system].defaultBranch;
        }
        else {
            return branch;
        }
    },
    getDownloadInfo = (branch, system) => {
        return PLATFORMS[system].branches[branch];
    },
    getFileChecksum = (container) => {
        return container.getChecksums().then((file) => {
            if(!file) {
                throw "No checksums.";
            }
            else {
                return container.getFileName().then((filename) => {
                    let sum, meta;
                    file.split("\n").some((line) => {
                        meta = line.split(" ");
                        if(meta[1] == "sha512" && meta[3].split("/").pop() == filename) {
                            sum = meta[0];
                            return true;
                        }
                        return false;
                    });

                    if(!sum) {
                        throw "Could not find a checksum for " + filename;
                    }
                    else {
                        return sum;
                    }
                });
            }
        });
    },
    writeFile = (target, buffer) => {
        return new Promise((resolve, reject) => {
            fs.writeFile(target, buffer, (err) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    },
    calculateChecksum = (target) => {
        return new Promise((resolve, reject) => {
            checksum.file(target, { algorithm: 'sha512' }, (e, cs) => {
                if(!e) {
                    resolve(cs);
                }
                else {
                    reject(e);
                }
            });
        });
    };

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
 * @param {string} arch - Architecture name.
 * @returns {module:get-firefox~Container} The container to describe the Firefox
 *                                          to download.
 */
exports.getContainer = function(branch, system, arch) {
    system = normalizeSystem(system);
    branch = normalizeBranch(branch, system);
    const spec = getDownloadInfo(branch, system),
        type = PLATFORMS[system].branches[branch].type,
        Constructor = CONTAINERS.find((c) => c.type == type);

    if(!(arch in spec)) {
        if(arch) {
            console.warn("There is no architecture " + arch + " for " + system + ", defaulting to " + spec.defaultArch);
        }
        arch = spec.defaultArch;
    }
    return new Constructor(spec.arches[arch]);
};

/**
 * Download Firefox to a target location.
 *
 * @param {module:get-firefox~Container} container - File downloading container.
 * @param {string} target - Target file name.
 * @async
 * @throws Whenever something goes wrong. No guaranteed type.
 * @returns Resolves as soon as the file is written.
 */
exports.downloadFirefox = function(container, target) {
    return container.getFileURL().then((url) => {
        return fetch(url);
    }).then((response) => {
        if(response.ok) {
            return response.buffer();
        }
        else {
            throw "Could not download Firefox: " + response.statusText;
        }
    }).then((buffer) => {
        return writeFile(target, buffer);
    });
};

/**
 * Check the checksum of a local file.
 *
 * @param {module:get-firefox~Container} container - File downloading container.
 * @param {string} localName - Local file name.
 * @async
 * @returns {string} If the checksums match or there is no checksums.
 * @throws On a checksum mismatch or an error getting the checksums.
 */
exports.check = function(container, localName) {
    return Promise.all([
        getFileChecksum(container),
        calculateChecksum(localName)
    ]).then((c) => {
        if(c[0] == c[1]) {
            return "Checksum matches";
        }
        else {
            throw "Checksum mismatch";
        }
    }, (e) => {
        if(e == "No checksums available") {
            return e;
        }
        else {
            throw e;
        }
    });
};

/**
 * Extract a Firefox archive.
 *
 * @param {string} file - Local file name.
 * @async
 * @throws When decompression fails
 * @returns As soon as decompression is done.
 */
exports.extract = function(file) {
    if(file.indexOf(".dmg") == -1) {
        return decompress(file, '.');
    }
    else {
        return Promise.reject("DMG extraction not implemented");
        //TODO extract dmg. But I'm too lazy to implement that. There's a dmg module out there.
    }
};
