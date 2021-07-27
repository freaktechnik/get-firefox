import fetch from "node-fetch";
const URL = "https://archive.mozilla.org/pub/",
    EXT_START = 0,
    EXT_LENGTH = 3,
    getBaseFilenameFromTestPackage = (testPackageName) => testPackageName
        .split(".")
        .slice(EXT_START, EXT_LENGTH)
        .join(".");

class ClassicContainer {
    static get type() {
        return "classic";
    }

    constructor(spec) {
        this.path = spec.path;
        this.fileEnding = spec.fileEnding;
    }

    async getFileURL() {
        const filename = await this.getFileName();
        return URL + this.path + filename;
    }

    async getFileName() {
        if(this.baseFilename) {
            return this.baseFilename + this.fileEnding;
        }
        else if(this.fetching) {
            return this.fetching;
        }

        this.fetching = this._fetch();
        return this.fetching;
    }

    async getChecksums() {
        await this.getFileName();
        const response = await fetch(`${URL + this.path + this.baseFilename}.checksums`);
        if(response.ok) {
            return response.text();
        }

        throw new Error(`Could not load checksums for ${this.path}: ${response.statusText}`);
    }

    async _fetch() {
        const response = await fetch(`${URL + this.path}test_packages.json`);
        if(!response.ok) {
            throw new Error(`Could not load info for ${this.path}: ${response.statusText}`);
        }
        const json = await response.json();
        this.baseFilename = getBaseFilenameFromTestPackage(json.common.shift());
        delete this.fetching;
        return this.baseFilename + this.fileEnding;
    }
}

export default ClassicContainer;
