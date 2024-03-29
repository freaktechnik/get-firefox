# get-firefox

[![codecov](https://codecov.io/gh/freaktechnik/get-firefox/graph/badge.svg?token=R7n92FrUF8)](https://codecov.io/gh/freaktechnik/get-firefox)

Download the latest Firefox from the command line. Supports almost any release,
except on Android.

This package works mostly without relying on
[archive.mozilla.org](https://archive.mozilla.org).

## Usage

### In the command line

Run `npx get-firefox --platform android --target fennec.apk --architecture arm-v15`
in the console to download the latest Firefox nightly for Android as `fennec.apk`.

Run `npx get-firefox --help` for a complete description of possible options or `npx get-firefox --list`
for a list of all available platforms, branches and architectures.

The extraction option can not extract `.dmg` or `.exe` packages.
Use `hdiutil`or similar to access the contents of the `.dmg`.

### As node module

```js
import { getDefaultSystem, getContainer, downloadFirefox, check, extract, PLATFORMS } from "get-firefox";
```

The main module implements a few public methods, see the binary file for their usage.

## Similar tools

- https://github.com/mozilla/mozdownload
- https://github.com/freaktechnik/moz-download-url

## License

The source code in this package is licensed under the MPL-2.0. A copy of the
license text can be found in the [LICENSE](LICENSE) file.
