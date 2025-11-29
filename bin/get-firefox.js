#!/usr/bin/env node
/* eslint-disable require-atomic-updates */
import fs from "node:fs/promises";
import { arrayBuffer } from "node:stream/consumers";
import {
    getDefaultSystem,
    getContainer,
    downloadFirefox,
    check,
    extract,
    PLATFORMS,
} from '../index.js';
import meow from "meow";
import chalk from "chalk";
import Listr from "listr";
import isCI from "is-ci";
const cli = meow(`
    Usage
        $ get-firefox

    Options
        -p, --platform <platform>    Platform of the Firefox version
        -a, --architecture <arch>    Platform architecture
        -t, --target                 Target file name or folder when extracting; defaults to the remote file name
        -c, --check                  Verify file checksums
        -e, --extract                Extract archive after download; does not work for dmg and exe files
        -l, --list                   List all platforms and architectures
        -b, --branch <branch>        Release branch to fetch
        -h, --help                   This output
        -v, --version                Version of the tool
        --verbose                    Don't animate output and show detailed progress log. Enabled by default in CI environments

    Examples
        $ get-firefox --platform android --target fenix.apk --architecture arm
`,
{
    importMeta: import.meta,
    flags: {
        architecture: {
            type: "string",
            shortFlag: "a",
        },
        branch: {
            type: "string",
            shortFlag: "b",
            default: "nightly",
        },
        check: {
            type: "boolean",
            shortFlag: "c",
        },
        extract: {
            type: "boolean",
            shortFlag: "e",
        },
        help: {
            type: "boolean",
            shortFlag: "h",
        },
        list: {
            type: "boolean",
            shortFlag: "l",
        },
        platform: {
            type: "string",
            shortFlag: "p",
            default: getDefaultSystem(),
        },
        target: {
            type: "string",
            shortFlag: "t",
        },
        version: {
            type: "boolean",
            shortFlag: "v",
        },
        verbose: {
            type: "boolean",
            default: isCI,
        },
    },
});

if(cli.flags.list) {
    const defaultPlatform = getDefaultSystem();
    for(const [
        platformName,
        plat,
    ] of Object.entries(PLATFORMS)) {
        let title = platformName;
        if(platformName == defaultPlatform) {
            title += chalk.gray(" (default)");
        }
        process.stdout.write(`${chalk.underline.bold(title)}\n`);
        for(const [
            branchName,
            branch,
        ] of Object.entries(plat.branches)) {
            title = chalk.bold(branchName);
            if(branchName == plat.defaultBranch) {
                title = chalk.yellow(title);
                title += chalk.gray(" (default)");
            }
            process.stdout.write(` ${title}\n`);
            const arches = Object.keys(branch.arches),
                multipleArches = arches.length;
            for(const arch of arches) {
                title = arch;
                if(arch == branch.defaultArch && multipleArches) {
                    title += chalk.gray(" (default)");
                }
                process.stdout.write(`   - ${title}\n`);
            }
        }
        process.stdout.write("\n");
    }
}
else {
    new Listr([
        {
            title: "Search latest Firefox",
            task: async (context) => {
                context.container = getContainer(cli.flags.branch, cli.flags.platform, cli.flags.architecture);
                const promises = [
                        context.container.getFileName(),
                        context.container.getFileURL(),
                    ],
                    [
                        fileName,
                        fileURL,
                    ] = await Promise.all(promises);

                context.url = fileURL;
                context.name = fileName;
            },
        },
        {
            title: "Get checksum",
            enabled: () => cli.flags.check,
            task: async (context, task) => {
                try {
                    context.checksums = await context.container.getChecksums();
                }
                catch(error) {
                    if(error.message === "No checksums available") {
                        task.output = error.message;
                        context.noChecksums = true;
                    }
                    else {
                        throw error;
                    }
                }
            },
        },
        {
            title: "Download",
            task: async (context, task) => {
                task.output = `Downloading from ${chalk.blue(context.url)}`;
                context.stream = await downloadFirefox(context.container);
                context.buffer = await arrayBuffer(context.stream);
            },
        },
        {
            title: "Verify checksum",
            enabled: () => cli.flags.check,
            skip: (context) => context.noChecksums || !context.checksums,
            task: async (context) => {
                context.stream = check(context.buffer, context.name, context.checksums);
                context.buffer = await arrayBuffer(context.stream);
            },
        },
        {
            title: "Extract",
            enabled: () => cli.flags.extract,
            task: (context, task) => {
                task.output = `Extracting the archive to ${chalk.blue(cli.flags.target || "./")}`;
                return extract(context.buffer, cli.flags.target);
            },
        },
        {
            title: "Write file to disk",
            enabled: () => !cli.flags.extract,
            task: (context, task) => {
                const saveAs = cli.flags.target || context.name;
                task.output = `Saving as ${chalk.blue(saveAs)}`;
                return fs.writeFile(saveAs, new Uint8Array(context.buffer));
            },
        },
    ], {
        renderer: cli.flags.verbose ? 'verbose' : 'default',
    }).run();
}
/* eslint-enable require-atomic-updates */
