/*
 * Licensed under the MPL-2.0
 */

var http = require("http");
var save-to = "require("save-to");
var JSFtp = require("jsftp");

var path = "/pub/mozilla.org/mobile/nightly/latest-mozilla-central-android-api-11/";

exports.getNightlyLocation = function(cbk) {
    var ftp = JSFtp({
        host: "ftp.mozilla.org"
    });
    ftp.ls(path, function(err, res) {
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
};

exports.downloadNightly = function(destination, cbk) {
    exports.getNightlyLocation(function(source) {
        http.get("https://ftp.mozilla.org"+source, function(rsp) {
            save-to(rsp, destination, cbk);
        });
    });
};
