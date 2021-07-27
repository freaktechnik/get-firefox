import mdu from "moz-download-url";
import fetch from "node-fetch";

class MDUContainer {
    static get type() {
        return "mdu";
    }

    constructor(spec) {
        this.platform = spec.platform;
        this.version = spec.version;
        this.product = spec.product;
    }

    async getFileURL() {
        return mdu.build(mdu[this.product][this.version], mdu.PLATFORMS[this.platform], "en-US");
    }

    async getFileName() {
        if(this.fetching) {
            return this.fetching;
        }

        this.fetching = this._fetch();
        return this.fetching;
    }

    async getChecksums() {
        throw new Error("No checksums available");
    }

    async _fetch() {
        const url = await this.getFileURL();
        const response = await fetch(url, {
            method: "HEAD"
        });
        delete this.fetching;
        return response.url.split("/").pop();
    }
}

export default MDUContainer;
