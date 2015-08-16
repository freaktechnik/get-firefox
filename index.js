/*
 * Licensed under the MPL-2.0
 */
//TODO add architecture & api version choice support
//TODO verify signatures stuff
//TODO autoextract?

var fs = require("fs");
var request = require("request");

var URL = "https://archive.mozilla.org/pub/";

var PLATFORMS = {
    android: {
        path: "mobile/nightly/latest-mozilla-central-android-api-11/",
        fileEnding: ".android-arm.apk"
    },
    linux: {
        path: "firefox/nightly/latest-trunk/",
        fileEnding: ".linux-x86_64.tar.bz2"
    },
    mac: {
        path: "firefox/nightly/latest-trunk/",
        fileEnding: ".mac.dmg"
    },
    win: {
        path: "firefox/nightly/latest-trunk/",
        fileEnding: ".win64.installer.exe"
    }
};

var getBaseFilenameFromTestPackage = function(testPackageName) {
    return testPackageName.split(".").slice(0, 3).join(".");
};

exports.getNightlyLocation = function(platform, cbk) {
    platform = platform || "linux";
    var platformObj = PLATFORMS[platform];
    request(URL+platformObj.path+"test_packages.json", function(error, response, body) {
        if(!error && response.statusCode == 200) {
            var json = JSON.parse(body);
            cbk(platformObj.path
                + getBaseFilenameFromTestPackage(json.common[0])
                + platformObj.fileEnding);
        }
    });
};

exports.downloadNightly = function(platform, destination, cbk) {
    exports.getNightlyLocation(platform, function(source) {
        destination = destination || source.split("/").pop();

        process.stdout.write("Downloading from "+ URL + source + " and saving to " + destination + "\n");
        var req = request(URL+source).pipe(fs.createWriteStream(destination));

        req.on("response", cbk);

        req.on("error", function(e) {
            process.stdout.write(e);
        });
    });
};
