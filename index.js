/*
 * Licensed under the MPL-2.0
 */
//TODO add architecture choice support

var fs = require("fs");
var request = require("request");

var URL = "https://archive.mozilla.org";
var BASE_PATH = "/pub/mozilla.org/";

var PLATFORMS = {
    android: {
        path: "mobile/nightly/latest-mozilla-central-android-api-11/",
        fileEnding: "apk",
        substringLength: ("common.tests.zip").length
    },
    linux: {
        path: "firefox/nightly/latest-trunk/",
        fileEnding: "linux-x86_64.tar.bz2",
        substringLength: ("win64.common.tests.zip").length
    },
    mac: {
        path: "firefox/nightly/latest-trunk/",
        fileEnding: "mac.dmg",
        substringLength: ("win64.common.tests.zip").length
    },
    win: {
        path: "firefox/nightly/latest-trunk/",
        fileEnding: "installer.exe",
        substringLength: ("common.tests.zip").length
    }
};

exports.getNightlyLocation = function(platform, cbk) {
    platform = platform || "linux";
    var platformObj = PLATFORMS[platform];
    request(URL+BASE_PATH+platformObj.path+"test_packages.json", function(error, response, body) {
        if(!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            cbk(platformObj.path
                + json.common[0].substr(0,
                      json.common[0].length-platformObj.substringLength)
                + platformObj.fileEnding);
        }
    });
};

exports.downloadNightly = function(platform, destination, cbk) {
    exports.getNightlyLocation(platform, function(source) {
        destination = destination || source.split("/").pop();

        process.stdout.write("Downloading from "+ URL + BASE_PATH + source + " and saving to " + destination + "\n");
        var req = request(URL+BASE_PATH+source).pipe(fs.createWriteStream(destination));

        req.on("response", cbk);

        req.on("error", function(e) {
            process.stdout.write(e);
        });
    });
};
