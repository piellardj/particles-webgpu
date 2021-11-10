import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";


const data = {
    title: "Particles",
    description: "WebGPU implementation of particles in a gravity field",
    introduction: ["TODO INTRO"],
    githubProjectName: "particles-web",
    additionalLinks: [],
    styleFiles: [],
    scriptFiles: [
        "script/main.js"
    ],
    indicators: [
        {
            id: "particles-count",
            label: "Particles count"
        },
    ],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
    },
    controlsSections: [
        {
            title: "Simulation",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Particle count",
                    id: "particles-count-range-id",
                    min: 1,
                    max: 20,
                    value: 1,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Speed",
                    id: "speed-range-id",
                    min: 0,
                    max: 1,
                    value: 0.5,
                    step: 0.05
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Attraction",
                    id: "attraction-range-id",
                    min: -1,
                    max: 1,
                    value: 0.7,
                    step: 0.05
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Friction",
                    id: "friction-range-id",
                    min: 0.998,
                    max: 1,
                    value: 0.9995,
                    step: 0.0001
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Bounce",
                    id: "bounce-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Gravity",
                    id: "gravity-range-id",
                    min: 0,
                    max: 1,
                    value: 0.1,
                    step: 0.001
                },
                {
                    type: Demopage.supportedControls.Button,
                    id: "reset-button-id",
                    label: "Reset"
                },
            ]
        },
        {
            title: "Colors",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Mode",
                    id: "colors-mode-tabs-id",
                    unique: true,
                    options: [
                        {
                            value: "unicolor",
                            label: "Unicolor",
                            checked: true,
                        },
                        {
                            value: "multicolor",
                            label: "Multicolor",
                        },
                    ]
                },
            ]
        },
        {
            title: "Rendering",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Particle size",
                    id: "sprite-size-range-id",
                    min: 1,
                    max: 17,
                    value: 5,
                    step: 2
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Particle opacity",
                    id: "opacity-range-id",
                    min: 0.1,
                    max: 1,
                    value: 0.8,
                    step: 0.005
                },
                {
                    type: Demopage.supportedControls.ColorPicker,
                    title: "Particle color",
                    id: "particle-color-id",
                    defaultValueHex: "#FFFFFF"
                }
            ]
        }
    ]
};

const SRC_DIR = path.resolve(__dirname);
const DEST_DIR = path.resolve(__dirname, "..", "docs");
const minified = true;

const buildResult = Demopage.build(data, DEST_DIR, {
    debug: !minified,
});

// disable linting on this file because it is generated
buildResult.pageScriptDeclaration = "/* tslint:disable */\n" + buildResult.pageScriptDeclaration;

const SCRIPT_DECLARATION_FILEPATH = path.join(SRC_DIR, "ts", "page-interface-generated.d.ts");
fs.writeFileSync(SCRIPT_DECLARATION_FILEPATH, buildResult.pageScriptDeclaration);
