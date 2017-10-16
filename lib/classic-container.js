"use strict";

const fetch = require("node-fetch"),
    URL = "https://archive.mozilla.org/pub/",
    EXT_START = 0,
    EXT_LENGTH = 3,
    getBaseFilenameFromTestPackage = function(testPackageName) {
        return testPackageName
            .split(".")
            .slice(EXT_START, EXT_LENGTH)
            .join(".");
    };

function ClassicContainer(spec) {
    this.path = spec.path;
    this.fileEnding = spec.fileEnding;
}
ClassicContainer.type = "classic";

ClassicContainer.prototype.getFileURL = function() {
    return this.getFileName().then((filename) => URL + this.path + filename);
};

ClassicContainer.prototype.getFileName = function() {
    if(this.baseFilename) {
        return Promise.resolve(this.baseFilename + this.fileEnding);
    }
    else if(this.fetching) {
        return this.fetching;
    }

    this.fetching = fetch(`${URL + this.path}test_packages.json`)
        .then((response) => {
            if(response.ok) {
                return response.json();
            }

            throw new Error(`Could not load info for ${this.path}: ${response.statusText}`);
        })
        .then((json) => {
            this.baseFilename = getBaseFilenameFromTestPackage(json.common.shift());
            delete this.fetching;
            return this.baseFilename + this.fileEnding;
        });
    return this.fetching;
};

ClassicContainer.prototype.getChecksums = function() {
    return this.getFileName().then(() => fetch(`${URL + this.path + this.baseFilename}.checksums`))
        .then((response) => {
            if(response.ok) {
                return response.text();
            }

            throw new Error(`Could not load checksums for ${this.path}: ${response.statusText}`);
        });
};

module.exports = ClassicContainer;
