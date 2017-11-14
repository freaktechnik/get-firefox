# get-firefox

[![Greenkeeper badge](https://badges.greenkeeper.io/freaktechnik/get-firefox.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/freaktechnik/get-firefox.svg?branch=master)](https://travis-ci.org/freaktechnik/get-firefox) [![codecov.io](https://codecov.io/github/freaktechnik/get-firefox/coverage.svg?branch=master)](https://codecov.io/github/freaktechnik/get-firefox?branch=master)

Download the latest Firefox from the command line. Supports almost any release,
except on Android.

This package works mostly without relying on
[archive.mozilla.org](https://archive.mozilla.org).

It determines some file names using a helper file built with the other
packages, so it might break if the build infrastructure changes.

## Installation

Install this command by running `npm install -g get-firefox`.

## Usage in the command line
Run `get-firefox --platform android --target fennec.apk --architecture arm-v11`
in the console to download the latest Firefox nightly for Android as `fennec.apk`.
Currently downloads 64-bit versions only, when there is a choice.

Run `get-firefox --help` for a complete description of possible options.

## Usage as node module
```js
var getFirefox = require("get-firefox");
```
The main module implements a few public methods, see the binary file for their usage.

## License
The source code in this package is licensed under the MPL-2.0. A copy of the
license text can be found in the [LICENSE](LICENSE) file.
