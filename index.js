/*
 * Licensed under the MPL-2.0
 */

var http = require("http");
var saveto = require("save-to");
var JSFtp = require("jsftp");

var path = "/pub/mozilla.org/mobile/nightly/latest-mozilla-central-android-api-11/";

exports.getNightlyLocation = function(cbk) {
    var ftp = new JSFtp({
        host: "ftp.mozilla.org"
    });
    ftp.auth(null, null, function(e) {
        if(e) process.stdout.write(e);
        ftp.ls(path, function(err, res) {
            if(err)  process.stdout.write(err);
            res.some(function(file) {
                if(file.name.match(/fennec-.*\.apk/)) {
                    cbk(path + file.name);
                    return true;
                }
                else {
                    return false;
                }
            });
        });
    });
};

exports.downloadNightly = function(destination, cbk) {
    exports.getNightlyLocation(function(source) {
        process.stdout.write("Downloading from http://ftp.mozilla.org" + source + "\n");
        var req = http.get("http://ftp.mozilla.org"+source, function(rsp) {
            saveto(rsp, destination, function(e, d) {
                if(e) process.stdout.write(e);
                else process.stdout.write("Saved to " + destination + "\n");
                cbk(e, d);
            });
        });

        req.on("error", function(e) {
            process.stdout.write(e);
        });
    });
};
