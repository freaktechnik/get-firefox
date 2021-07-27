import fetch from "node-fetch";
import taskcluster from "taskcluster-client";

const rootUrl = "https://firefox-ci-tc.services.mozilla.com";

class TaskclusterContainer {
    static get type() {
        return "taskcluster";
    }

    constructor(spec) {
        this.namespace = spec.namespace;
        this.fileEnding = spec.fileEnding;
        this.path = spec.path;
        this.queue = new taskcluster.Queue({
            rootUrl
        });
        this._getArtifacts();
    }

    async getFileURL() {
        const artifact = await this._getArtifact();
        return this.queue.buildUrl(this.queue.getLatestArtifact, this.taskId, artifact.name);
    }

    async getFileName() {
        const artifact = await this._getArtifact();
        return artifact.name.split("/").pop();
    }

    async getChecksums() {
        const artifacts = await this._getArtifacts(),
            artifactName = artifacts.find((a) => a.name.includes(".checksums")).name,
            response = await fetch(this.queue.buildUrl(this.queue.getLatestArtifact, this.taskId, artifactName));
        if(response.ok) {
            return response.text();
        }

        throw new Error(`Could not load checksums from ${response.url}:${response.statusText}`);
    }

    async _fetch() {
        const index = new taskcluster.Index({
                rootUrl
            }),
            json = await index.findTask(this.namespace);
        this.taskId = json.taskId;

        const artifactJson = await this.queue.listLatestArtifacts(json.taskId);
        this.artifacts = artifactJson.artifacts;
        delete this.fetching;
        return this.artifacts;
    }

    async _getArtifacts() {
        if(this.artifacts) {
            return this.artifacts;
        }
        else if(this.fetching) {
            return this.fetching;
        }

        this.fetching = this._fetch();
        return this.fetching;
    }

    _getArtifact() {
        if(!this.artifact) {
            this.artifact = this._getArtifacts()
                .then((artifacts) => artifacts.find((artifact) => artifact.name.includes(this.fileEnding) && (!this.path || artifact.name.includes(this.path))));
        }
        return this.artifact;
    }
}

export default TaskclusterContainer;
