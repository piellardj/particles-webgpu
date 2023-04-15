import * as fs from "fs";
import * as path from "path";
import { Demopage } from "webpage-templates";


const data = {
    title: "Particles",
    description: "WebGPU implementation of particles in a gravity field",
    introduction: [
        "This is a basic particles simulation running fully on GPU, using the new WebGPU API.",
        "Particles evolve independently, following simple gravitational rules. There can be several attraction points at once. You can control one with your mouse by pressing the left mouse button."
    ],
    githubProjectName: "particles-webgpu",
    readme: {
        filepath: path.join(__dirname, "..", "README.md"),
        branchName: "main"
    },
    additionalLinks: [],
    styleFiles: [
        "css/attractor-overlay.css"
    ],
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
            title: "Attractors",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Mouse force",
                    id: "attraction-range-id",
                    min: -1,
                    max: 1,
                    value: 0.7,
                    step: 0.05
                },
                {
                    type: Demopage.supportedControls.Select,
                    title: "Preset",
                    id: "attractors-preset-select-id",
                    placeholder: "Custom",
                    options: [
                        {
                            value: "none",
                            label: "None",
                        },
                        {
                            value: "orbit",
                            label: "Orbit",
                            checked: true,
                        },
                        {
                            value: "sines",
                            label: "Sines",
                        },
                        {
                            value: "central-attractive",
                            label: "Central (attractive)",
                        },
                        {
                            value: "central-repulsive",
                            label: "Central (replusilve)",
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Display",
                    id: "display-attractors-checkbox-id",
                    checked: true
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
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Auto",
                    id: "auto-color-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "High quality",
                    id: "high-color-quality-checkbox-id",
                    checked: false
                },
                {
                    type: Demopage.supportedControls.ColorPicker,
                    title: "Particle color",
                    id: "particle-color-id",
                    defaultValueHex: "#BC4212"
                },
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Source",
                    id: "color-source-tabs-id",
                    unique: true,
                    options: [
                        {
                            value: "image",
                            label: "From image",
                            checked: true,
                        },
                        {
                            value: "velocity",
                            label: "From velocity",
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Select,
                    title: "Image",
                    id: "image-preset-select-id",
                    placeholder: "Custom",
                    options: [
                        {
                            value: "colors",
                            label: "Colors",
                            checked: true,
                        },
                        {
                            value: "ladybug",
                            label: "Ladybug",
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.FileUpload,
                    title: "Custom",
                    id: "input-image-upload-button",
                    accept: [".png", ".jpg", ".bmp", ".webp"],
                    defaultMessage: "Upload an image"
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
                    value: 1,
                    step: 2
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Blending",
                    id: "blending-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Particle opacity",
                    id: "opacity-range-id",
                    min: 0.01,
                    max: 1,
                    value: 0.1,
                    step: 0.005
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show indicators",
                    id: "show-indicators-checkbox-id",
                    checked: true
                },
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

fs.copyFileSync(path.join(SRC_DIR, "resources", "attractor-overlay.css"), path.join(DEST_DIR, "css", "attractor-overlay.css"));
