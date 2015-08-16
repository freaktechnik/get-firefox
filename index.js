/*
 * Licensed under the MPL-2.0
 */

//TODO win zips vs. installers
//TODO multiple release channels/branches
//TODO verify checksum file signature...

var fs = require("fs");
var request = require("request");
var progress = require("request-progress");
var Promise = require("es6-promise").Promise;
var checksum = require("checksum");
var Decompress = require("decompress");

var URL = "https://archive.mozilla.org/pub/";

var PLATFORMS = {
    android: {
        defaultArch: "arm-v11",
        arches: {
            "arm-v11": {
                path: "mobile/nightly/latest-mozilla-central-android-api-11/",
                fileEnding: ".android-arm.apk"
            },
            "arm-v9": {
                path: "mobile/nightly/latest-mozilla-central-android-api-9/",
                fileEnding: ".android-arm.apk"
            },
            "x86": {
                path: "mobile/nightly/latest-mozilla-entral-android-x86/",
                fileEnding: ".android-i386.apk"
            }
        }
    },
    linux: {
        defaultArch: "x86_64",
        arches: {
            "x86_64": {
                path: "firefox/nightly/latest-trunk/",
                fileEnding: ".linux-x86_64.tar.bz2"
            },
            "x86": {
                path: "firefox/nightly/latest-trunk/",
                fileEnding: ".linux-i686.tar.bz2"
            }
        }
    },
    mac: {
        defaultArch: "multi",
        arches: {
            "multi": {
                path: "firefox/nightly/latest-trunk/",
                fileEnding: ".mac.dmg"
            }
        }
    },
    win: {
        defaultArch: "x86_64",
        arches: {
            "x86_64": {
                path: "firefox/nightly/latest-trunk/",
                fileEnding: ".win64.installer.exe"
            },
            "x86": {
                path: "firefox/nightly/latest-trunk/",
                fileEnding: ".win32.installer.exe"
            }
        }
    }
};

var getBaseFilenameFromTestPackage = function(testPackageName) {
    return testPackageName.split(".").slice(0, 3).join(".");
};

var getDownloadInfo = function(system, arch) {
    if(!(system in PLATFORMS)) {
        console.warn("Unknown platform '"+system+"', defaulting to linux");
        system = "linux";
    }
    var systemObj = PLATFORMS[system];
    if(!(arch in systemObj.arches)) {
        if(arch) {
            console.warn("There is no architecture "+arch+" for "+system+", defaulting to "+systemObj.defaultArch);
        }
        arch = systemObj.defaultArch;
    }
    return systemObj.arches[arch];
};

var getArchForURL = function(source) {
    for(var system in PLATFORMS) {
        for(var a in PLATFORMS[system].arches) {
            if(source.indexOf(PLATFORMS[system].arches[a].fileEnding) != -1) {
                return PLATFORMS[system].arches[a];
            }
        }
    }
};

var getChecksumFileName = function(source) {
    var arch = getArchForURL(source);

    var purgeLength = arch.fileEnding.split(".").length - 2;

    return source.split(".").slice(0, -purgeLength).join(".") + ".checksums";
};

var getChecksumFile = function(source) {
    return new Promise(function(resolve, reject) {
        request(getChecksumFileName(source), function(error, response, body) {
            if(!error && response.statusCode == 200) {
                resolve(body);
            }
            else {
                reject(error);
            }
        });
    });
};

var getFileChecksum = function(source) {
    return getChecksumFile(source).then(function(file) {
        var fileName = source.split("/").pop();
        var sum, meta;
        file.split("\n").some(function(line) {
            meta = line.split(" ");
            if(meta[1] == "sha512" && meta[3].split("/").pop() == fileName) {
                sum = meta[0];
                return true;
            }
            return false;
        });
        if(!sum)
            throw "Could not find a checksum for "+fileName;
        else
            return sum;
    });
};

var getDecompressPlugin = function(source) {
    var ext = source.split(".").pop();
    if(ext == "bz2") {
        return Decompress.tarbz2();
    }
    else if(ext == "zip") {
        return Decompress.zip();
    }
    else if(ext == "gz") {
        return Decompress.targz();
    }
    else if(ext == "tar") {
        return Decompress.tar();
    }
};

exports.getNightlyLocation = function(platform, arch) {
    platform = platform || "linux";
    var platformObj = getDownloadInfo(platform, arch);

    return new Promise(function(resolve, reject) {
        request(URL+platformObj.path+"test_packages.json", function(error, response, body) {
            if(!error && response.statusCode == 200) {
                var json = JSON.parse(body);
                resolve(URL
                    + platformObj.path
                    + getBaseFilenameFromTestPackage(json.common[0])
                    + platformObj.fileEnding
                );
            }
            else {
                reject("Couldn't load the information file "+URL+platformObj.path+"test_packages.json");
            }
        });
    });
};

exports.downloadNightly = function(source, destination, progressCbk) {
    return new Promise(function(resolve, reject) {
        progress(request(source))
        .on("error", reject)
        .on("progress", progressCbk)
        .pipe(fs.createWriteStream(destination))
        .on("error", reject)
        .on("close", resolve);
    });
};

exports.check = function(source, localName) {
    return Promise.all([
        getFileChecksum(source),
        new Promise(function(resolve, reject) {
            checksum.file(localName, { algorithm: 'sha512' }, function(e, cs) {
                if(!e)
                    resolve(cs);
                else
                    reject(e);
            });
        })
    ]).then(function(c) {
        if(c[0] == c[1])
            return "Checksum matches";
        else
            throw "Checksum mismatch";
    });
};

exports.extract = function(file) {
    if(file.indexOf(".dmg") == -1) {
        return new Promise(function(resolve, reject) {
            new Decompress()
            .src(file)
            .dest('.')
            .use(getDecompressPlugin(file))
            .run(function(e) {
                if(!e)
                    resolve();
                else
                    reject();
            });
        });
    }
    else {
        //TODO extract dmg. But I'm too lazy to implement that. There's a dmg module out there.
    }
};
