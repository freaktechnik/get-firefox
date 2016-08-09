const fetch = require("node-fetch"),
    taskcluster = require("taskcluster-client"),
    Promise = require("any-promise"),

    URL = "https://queue.taskcluster.net/v1/task/";

function TaskclusterContainer(spec) {
    this.namespace = spec.namespace;
    this.path = spec.path;
    this.fileEnding = spec.fileEnding;
}
TaskclusterContainer.type = "taskcluster";

TaskclusterContainer.prototype.getFileURL = function() {
    return this.getFileName().then((filename) => URL + this.taskId + this.path + filename);
};

TaskclusterContainer.prototype.getFileName = function() {
    if(this.baseFilename) {
        return Promise.resolve(this.baseFilename + this.fileEnding);
    }
    else if(this.fetching) {
        return this.fetching;
    }
    else {
        const index = new taskcluster.Index();

        this.fetching = index.findTask(this.namespace).then((json) => {
            this.taskId = json.taskId;

            const queue = new taskcluster.Queue();
            return queue.listLatestArtifacts(json.taskId);
        }).then((json) => {
            const artifact = json.artifacts.find((a) => a.name.indexOf(this.fileEnding) != -1),
                path = artifact.name.split("/"),
                fullName = path.pop();
            this.path += path.join("/") + "/";
            this.baseFilename = fullName.substring(0, fullName.length - this.fileEnding.length);
            delete this.fetching;
            return fullName;
        });
        return this.fetching;
    }
};

TaskclusterContainer.prototype.getChecksums = function() {
    return this.getFileName().then(() => {
        return fetch(URL + this.taskId + this.path + this.baseFilename + ".checksums");
    }).then((response) => {
        if(response.ok) {
            return response.text();
        }
        else {
            throw "Could not load checksums for " + this.path + ": " + response.statusText;
        }
    });
};

module.exports = TaskclusterContainer;
