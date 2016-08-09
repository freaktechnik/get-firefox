const mdu = require("moz-download-url"),
    Promise = require("any-promise"),
    fetch = require("node-fetch");

function MDUContainer(platform, arch, spec) {
    this.platform = spec.arches[arch].platform;
}
MDUContainer.type = "mdu";

MDUContainer.prototype.getFileURL = function() {
    return Promise.resolve(mdu.build("firefox-nightly-latest", this.platform, "en-US"));
};

MDUContainer.prototype.getFileName = function() {
    if(this.fetching) {
        return this.fetching;
    }
    else {
        this.fetching = this.getFileURL().then((url) => {
            return fetch(url, {
                method: "HEAD"
            });
        }).then((response) => {
            delete this.fetching;
            return response.url.split("/").pop();
        });
        return this.fetching;
    }
};

MDUContainer.prototype.getChecksums = function() {
    return Promise.reject(false);
};

module.exports = MDUContainer;
