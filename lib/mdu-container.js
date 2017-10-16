"use strict";

const mdu = require("moz-download-url"),
    fetch = require("node-fetch");

function MDUContainer(spec) {
    this.platform = spec.platform;
    this.version = spec.version;
    this.product = spec.product;
}
MDUContainer.type = "mdu";

MDUContainer.prototype.getFileURL = function() {
    return Promise.resolve(mdu.build(mdu[this.product][this.version], mdu.PLATFORMS[this.platform], "en-US"));
};

MDUContainer.prototype.getFileName = function() {
    if(this.fetching) {
        return this.fetching;
    }

    this.fetching = this.getFileURL().then((url) => fetch(url, {
        method: "HEAD"
    }))
        .then((response) => {
            delete this.fetching;
            return response.url.split("/").pop();
        });
    return this.fetching;
};

MDUContainer.prototype.getChecksums = function() {
    return Promise.reject(new Error("No checksums available"));
};

module.exports = MDUContainer;
