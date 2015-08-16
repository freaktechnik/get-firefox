/*
 * Licensed under the MPL-2.0
 */

var fs = require("fs");
var request = require("request");

var URL = "https://archive.mozilla.org";

var path = "/pub/mozilla.org/mobile/nightly/latest-mozilla-central-android-api-11/";

exports.getNightlyLocation = function(cbk) {
    request(URL+path+"test_packages.json", function(error, response, body) {
        if(!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            cbk(json.common[0].substr(0,  json.common[0].length-("common.tests.zip").length)+"apk");
        }
    });
};

exports.downloadNightly = function(destination, cbk) {
    exports.getNightlyLocation(function(source) {
        process.stdout.write("Downloading from "+ URL + path + source + " and saving to " + destination + "\n");
        var req = request(URL+path+source).pipe(fs.createWriteStream(destination));

        req.on("response", cbk);

        req.on("error", function(e) {
            process.stdout.write(e);
        });
    });
};
