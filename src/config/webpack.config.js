const path = require("path");

const PROJECT_DIR = path.resolve(__dirname, "..", "..");
const INPUT_SCRIPT_DIR = path.join(PROJECT_DIR, "src", "ts");
const OUTPUT_SCRIPT_DIR = path.join(PROJECT_DIR, "docs", "script");

function buildConfig(entryFilename /* string */, outputFilename /* string */) /* object */ {
    return {
        name: entryFilename,
        devtool: "source-map",
        mode: "development",
        entry: path.join(INPUT_SCRIPT_DIR, entryFilename),
        output: {
            path: OUTPUT_SCRIPT_DIR,
            filename: outputFilename,
            assetModuleFilename: path.join("..", "rc", "images", "[hash][ext][query]")
        },
        target: ["web", "es2017"],
        resolve: {
            extensions: [".ts"]
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                compilerOptions: {
                                    rootDir: INPUT_SCRIPT_DIR
                                },
                                configFile: path.join(PROJECT_DIR, "src", "config", 'tsconfig.json')
                            }
                        }
                    ],
                },
                {
                    test: /\.wgsl$/,
                    type: 'asset/source',
                },
                {
                    test: /\.png$/,
                    type: 'asset/resource',
                },
            ]
        }
    };
}

module.exports = [
    buildConfig("main.ts", "main.js"),
];
