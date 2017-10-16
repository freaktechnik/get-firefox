"use strict";

const fetch = require("node-fetch"),
    taskcluster = require("taskcluster-client");

function TaskclusterContainer(spec) {
    this.namespace = spec.namespace;
    this.fileEnding = spec.fileEnding;
    this.queue = new taskcluster.Queue();
    this._getArtifacts();
}
TaskclusterContainer.type = "taskcluster";

TaskclusterContainer.prototype._getArtifacts = function() {
    if(this.artifacts) {
        return Promise.resolve(this.artifacts);
    }
    else if(this.fetching) {
        return this.fetching;
    }

    const index = new taskcluster.Index();

    this.fetching = index.findTask(this.namespace).then((json) => {
        this.taskId = json.taskId;

        return this.queue.listLatestArtifacts(json.taskId);
    })
        .then((json) => {
            this.artifacts = json.artifacts;
            delete this.fetching;
            return this.artifacts;
        });
    return this.fetching;
};

TaskclusterContainer.prototype.getFileURL = function() {
    return this._getArtifacts().then((artifacts) => {
        const artifactName = artifacts.find((a) => a.name.includes(this.fileEnding)).name;
        return this.queue.buildUrl(this.queue.getLatestArtifact, this.taskId, artifactName);
    });
};

TaskclusterContainer.prototype.getFileName = function() {
    return this._getArtifacts().then((artifacts) => {
        const artifact = artifacts.find((a) => a.name.includes(this.fileEnding));
        return artifact.name.split("/").pop();
    });
};

TaskclusterContainer.prototype.getChecksums = function() {
    return this._getArtifacts().then((artifacts) => {
        const artifactName = artifacts.find((a) => a.name.includes(".checksums")).name;
        return fetch(this.queue.buildUrl(this.queue.getLatestArtifact, this.taskId, artifactName));
    })
        .then((response) => {
            if(response.ok) {
                return response.text();
            }

            throw new Error(`Could not load checksums from ${response.url}:${response.statusText}`);
        });
};

module.exports = TaskclusterContainer;
