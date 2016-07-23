# get-firefox
[![Dependency Status](https://dependencyci.com/github/freaktechnik/get-firefox/badge)](https://dependencyci.com/github/freaktechnik/get-firefox)

Download the latest Firefox from the command line. Currently only desktop and
android nightlies.

Note that this package works even after the recent ftp.mozilla.org to
[archive.mozilla.org](https://archive.mozilla.org) change.

It determines the file names using a helperfile built with the other packages,
so it might break if the build infrastructure changes.

## Installation

Install this command by running `npm install -g get-firefox`.

## Usage in the command line
Run `get-firefox --platform android --target fennec.apk --architecture arm-v11` in the console to download the latest Firefox nightly for Android as `fennec.apk`. Currently downloads 64-bit versions only, when there is a choice.

Run `get-firefox --help` for a complete description of possible options.

## Usage as node module
```js
var getFirefox = require("get-firefox");
```
The main module implements three public methods.

### getNightlyLocation(platform, architecture)
Returns a promise that resolves with an URL pointing to the file to download.

### downloadNightly(source, destination, progressCallback)
Downloads a file from source and saves it in destination. Returns a promise.
The progress callback is called with a state object with the following structure:
```js
{
  total: 1000, // Total size in bytes
  received: 500, // Received size in bytes
  percent: 0.5 // Percentage received
}
```

### extract(filePath)
Extracts the file in `filePath` in place. Currently supports zip, tar, tar.gz
and tar.bz2 archives.

## License
The source code in this package is licensed under the MPL-2.0. A copy of the
license text can be found in the [LICENSE](LICENSE) file.
