const fetch = require("node-fetch"),
    Promise = require("any-promise"),

    URL = "https://archive.mozilla.org/pub/",
    getBaseFilenameFromTestPackage = function(testPackageName) {
        return testPackageName.split(".").slice(0, 3).join(".");
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
    else {
        this.fetching = fetch(URL + this.path + "test_packages.json").then((response) => {
            if(response.ok) {
                return response.json();
            }
            else {
                throw "Could not load info for " + this.path + ": " + response.statusText;
            }
        }).then((json) => {
            this.baseFilename = getBaseFilenameFromTestPackage(json.common[0]);
            delete this.fetching;
            return this.baseFilename + this.fileEnding;
        });
        return this.fetching;
    }
};

ClassicContainer.prototype.getChecksums = function() {
    return this.getFilename().then(() => {
        return fetch(URL + this.path + this.baseFilename + ".checksums");
    }).then((response) => {
        if(response.ok) {
            return response.text();
        }
        else {
            throw "Could not load checksums for " + this.path + ": " + response.statusText;
        }
    });
};

module.exports = ClassicContainer;
