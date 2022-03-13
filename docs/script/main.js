/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ts/attractors.ts":
/*!******************************!*\
  !*** ./src/ts/attractors.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.update = exports.setContainer = exports.setOverlays = exports.getPreset = void 0;
const parameters_1 = __webpack_require__(/*! ./parameters */ "./src/ts/parameters.ts");
let time = 0;
let container;
const className = "attractor-overlay";
function setContainer(element) {
    container = element;
}
exports.setContainer = setContainer;
function setOverlays(attractors) {
    if (!container) {
        throw new Error("A container is needed for overlays.");
    }
    if (!parameters_1.Parameters.displayAttractors) {
        const elements = Array.from(container.querySelectorAll(`.${className}`));
        while (elements.length > 0) {
            const lastElement = elements.pop();
            lastElement.parentElement.removeChild(lastElement);
        }
        return;
    }
    const elements = Array.from(container.querySelectorAll(`.${className}`));
    while (elements.length > attractors.length) {
        const lastElement = elements.pop();
        lastElement.parentElement.removeChild(lastElement);
    }
    while (elements.length < attractors.length) {
        const newElement = document.createElement("span");
        newElement.className = className;
        container.appendChild(newElement);
        elements.push(newElement);
    }
    for (let i = 0; i < elements.length; i++) {
        const x = 100 * (0.5 + 0.5 * attractors[i].position[0]);
        const y = 100 * (0.5 + 0.5 * attractors[i].position[1]);
        elements[i].style.left = `${x.toFixed(2)}%`;
        elements[i].style.top = `${y.toFixed(2)}%`;
    }
}
exports.setOverlays = setOverlays;
function getPreset() {
    const attractorsList = [];
    /* eslint indent: "off" */
    const preset = parameters_1.Parameters.attractorsPreset;
    switch (preset) {
        case parameters_1.AttractorsPreset.ORBIT:
            {
                attractorsList.push({
                    force: 7,
                    position: [0, 0],
                });
                attractorsList.push({
                    force: 5,
                    position: [0.4 * Math.cos(time), 0.4 * Math.sin(time)],
                });
                attractorsList.push({
                    force: 6,
                    position: [0.8 * Math.cos(-0.9 * time), 0.8 * Math.sin(-0.9 * time)],
                });
                break;
            }
        case parameters_1.AttractorsPreset.SINES:
            {
                attractorsList.push({
                    force: 7,
                    position: [0.7 * Math.cos(time), 0.7 * Math.sin(2 * time)],
                });
                attractorsList.push({
                    force: 7,
                    position: [0.7 * Math.cos(1.8 * (time + 0.5)), 0.7 * Math.sin(0.9 * (time + 0.5))],
                });
                break;
            }
        case parameters_1.AttractorsPreset.CENTRAL_ATTRACTIVE:
            {
                attractorsList.push({
                    force: 5,
                    position: [0, 0],
                });
                break;
            }
        case parameters_1.AttractorsPreset.CENTRAL_REPULSIVE:
            {
                attractorsList.push({
                    force: -5,
                    position: [0, 0],
                });
                break;
            }
        default:
            break;
    }
    const containerBox = container.getBoundingClientRect();
    const aspectRatio = containerBox.width / containerBox.height;
    for (const attractor of attractorsList) {
        attractor.position[0] /= aspectRatio;
    }
    return attractorsList;
}
exports.getPreset = getPreset;
function update(dt) {
    time += dt;
}
exports.update = update;


/***/ }),

/***/ "./src/ts/engine.ts":
/*!**************************!*\
  !*** ./src/ts/engine.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="./page-interface-generated" />
/// <reference types="./webgpu-utils/wgsl-type" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Engine = void 0;
const initialize_colors_wgsl_1 = __importDefault(__webpack_require__(/*! ../shaders/initialize-colors.wgsl */ "./src/shaders/initialize-colors.wgsl"));
const update_wgsl_1 = __importDefault(__webpack_require__(/*! ../shaders/update.wgsl */ "./src/shaders/update.wgsl"));
const color_part_wgsl_1 = __importDefault(__webpack_require__(/*! ../shaders/utils/color.part.wgsl */ "./src/shaders/utils/color.part.wgsl"));
const Attractors = __importStar(__webpack_require__(/*! ./attractors */ "./src/ts/attractors.ts"));
const helpers_1 = __webpack_require__(/*! ./helpers */ "./src/ts/helpers.ts");
const parameters_1 = __webpack_require__(/*! ./parameters */ "./src/ts/parameters.ts");
const renderer_instanced_monocolor_1 = __webpack_require__(/*! ./render/renderer-instanced-monocolor */ "./src/ts/render/renderer-instanced-monocolor.ts");
const renderer_instanced_multicolor_1 = __webpack_require__(/*! ./render/renderer-instanced-multicolor */ "./src/ts/render/renderer-instanced-multicolor.ts");
const renderer_instanced_multicolor_velocity_1 = __webpack_require__(/*! ./render/renderer-instanced-multicolor-velocity */ "./src/ts/render/renderer-instanced-multicolor-velocity.ts");
const renderer_monocolor_1 = __webpack_require__(/*! ./render/renderer-monocolor */ "./src/ts/render/renderer-monocolor.ts");
const renderer_multicolor_1 = __webpack_require__(/*! ./render/renderer-multicolor */ "./src/ts/render/renderer-multicolor.ts");
const renderer_multicolor_velocity_1 = __webpack_require__(/*! ./render/renderer-multicolor-velocity */ "./src/ts/render/renderer-multicolor-velocity.ts");
const WebGPU = __importStar(__webpack_require__(/*! ./webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
const MAX_ATTRACTORS = 4;
class Engine {
    constructor(targetTextureFormat) {
        this.particleBatches = [];
        this.rendererMonocolor = new renderer_monocolor_1.RendererMonocolor(targetTextureFormat);
        this.rendererMulticolor = new renderer_multicolor_1.RendererMulticolor(targetTextureFormat);
        this.rendererMulticolorVelocity = new renderer_multicolor_velocity_1.RendererMulticolorVelocity(targetTextureFormat);
        this.rendererInstancedMonocolor = new renderer_instanced_monocolor_1.RendererInstancedMonocolor(targetTextureFormat);
        this.rendererInstancedMulticolor = new renderer_instanced_multicolor_1.RendererInstancedMulticolor(targetTextureFormat);
        this.rendererInstancedMulticolorVelocity = new renderer_instanced_multicolor_velocity_1.RendererInstancedMulticolorVelocity(targetTextureFormat);
        this.computePipeline = WebGPU.device.createComputePipeline({
            compute: {
                module: WebGPU.device.createShaderModule({ code: update_wgsl_1.default }),
                entryPoint: "main"
            }
        });
        this.computeUniformsBuffer = WebGPU.device.createBuffer({
            size: 96,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });
        this.initializeColorsComputePipeline = WebGPU.device.createComputePipeline({
            compute: {
                module: WebGPU.device.createShaderModule({ code: color_part_wgsl_1.default + initialize_colors_wgsl_1.default }),
                entryPoint: "main"
            }
        });
    }
    get particlesCount() {
        let count = 0;
        for (const particlesBatch of this.particleBatches) {
            count += particlesBatch.particlesCount;
        }
        return count;
    }
    update(commandEncoder, dt, aspectRatio) {
        const attractors = Attractors.getPreset();
        if (Page.Canvas.isMouseDown()) {
            const attractor = {
                position: Page.Canvas.getMousePosition(),
                force: 10 * parameters_1.Parameters.attraction,
            };
            attractor.position[0] = 2 * attractor.position[0] - 1;
            attractor.position[1] = 2 * attractor.position[1] - 1;
            attractors.push(attractor);
        }
        Attractors.setOverlays(attractors);
        const uniformForce = [0, 3 * parameters_1.Parameters.gravity];
        const uniformsBufferData = this.buildComputeUniforms(dt, aspectRatio, uniformForce, attractors);
        WebGPU.device.queue.writeBuffer(this.computeUniformsBuffer, 0, uniformsBufferData);
        for (const particlesBatch of this.particleBatches) {
            const computePass = commandEncoder.beginComputePass();
            computePass.setPipeline(this.computePipeline);
            computePass.setBindGroup(0, particlesBatch.computeBindgroup);
            computePass.dispatch(particlesBatch.dispatchSize);
            computePass.end();
        }
    }
    draw(canvasWidth, canvasHeight, renderPassEncoder) {
        let renderer;
        const instanced = (parameters_1.Parameters.spriteSize > 1);
        if (parameters_1.Parameters.colorMode === parameters_1.ColorMode.UNICOLOR) {
            if (instanced) {
                renderer = this.rendererInstancedMonocolor;
            }
            else {
                renderer = this.rendererMonocolor;
            }
        }
        else if (parameters_1.Parameters.colorSource === parameters_1.ColorSource.IMAGE) {
            if (instanced) {
                renderer = this.rendererInstancedMulticolor;
            }
            else {
                renderer = this.rendererMulticolor;
            }
        }
        else {
            if (instanced) {
                renderer = this.rendererInstancedMulticolorVelocity;
            }
            else {
                renderer = this.rendererMulticolorVelocity;
            }
        }
        for (const particlesBatch of this.particleBatches) {
            renderer.draw(canvasWidth, canvasHeight, renderPassEncoder, particlesBatch);
        }
    }
    reset(wantedParticlesCount) {
        for (const particlesBatch of this.particleBatches) {
            if (particlesBatch.gpuBuffer) {
                particlesBatch.gpuBuffer.destroy();
            }
            if (particlesBatch.colorsBuffer) {
                particlesBatch.colorsBuffer.destroy();
            }
        }
        this.particleBatches.length = 0;
        let totalGpuBufferSize = 0, totalColorBufferSize = 0;
        const particleSize = Float32Array.BYTES_PER_ELEMENT * (2 + 2);
        const maxDispatchSize = Math.floor(WebGPU.device.limits.maxStorageBufferBindingSize / particleSize / Engine.WORKGROUP_SIZE);
        let particlesLeftToAllocate = wantedParticlesCount;
        while (particlesLeftToAllocate > 0) {
            const idealDispatchSize = Math.ceil(particlesLeftToAllocate / Engine.WORKGROUP_SIZE);
            const dispatchSize = Math.min(idealDispatchSize, maxDispatchSize);
            const particlesCount = dispatchSize * Engine.WORKGROUP_SIZE;
            particlesLeftToAllocate -= particlesCount;
            const gpuBufferSize = particlesCount * particleSize;
            const gpuBuffer = WebGPU.device.createBuffer({
                size: gpuBufferSize,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
                mappedAtCreation: true,
            });
            totalGpuBufferSize += gpuBufferSize;
            const colorsBufferSize = particlesCount * Uint32Array.BYTES_PER_ELEMENT;
            const colorsGpuBuffer = WebGPU.device.createBuffer({
                size: colorsBufferSize,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
                mappedAtCreation: false,
            });
            totalColorBufferSize += colorsBufferSize;
            const gpuBufferData = gpuBuffer.getMappedRange();
            const particlesBuffer = new Float32Array(gpuBufferData);
            for (let iParticle = 0; iParticle < particlesCount; iParticle++) {
                particlesBuffer[4 * iParticle + 0] = Math.random() * 2 - 1;
                particlesBuffer[4 * iParticle + 1] = Math.random() * 2 - 1;
                particlesBuffer[4 * iParticle + 2] = 0;
                particlesBuffer[4 * iParticle + 3] = 0;
            }
            gpuBuffer.unmap();
            const computeBindgroup = WebGPU.device.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: gpuBuffer
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: this.computeUniformsBuffer
                        }
                    }
                ]
            });
            const initializeColorsComputeBindgroup = WebGPU.device.createBindGroup({
                layout: this.initializeColorsComputePipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: gpuBuffer
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: colorsGpuBuffer
                        }
                    }
                ]
            });
            this.particleBatches.push({
                gpuBuffer,
                computeBindgroup,
                colorsBuffer: colorsGpuBuffer,
                initializeColorsComputeBindgroup,
                particlesCount,
                dispatchSize,
            });
        }
        console.info(`GPU memory used:\n  - positions/velocities: ${(0, helpers_1.bytesToString)(totalGpuBufferSize)}\n  - colors: ${(0, helpers_1.bytesToString)(totalColorBufferSize)}`);
    }
    initializeColors(commandEncoder, sampler, texture) {
        const textureBindgroup = WebGPU.device.createBindGroup({
            layout: this.initializeColorsComputePipeline.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: sampler
                },
                {
                    binding: 1,
                    resource: texture.createView()
                }
            ]
        });
        for (const particlesBatch of this.particleBatches) {
            const computePass = commandEncoder.beginComputePass();
            computePass.setPipeline(this.initializeColorsComputePipeline);
            computePass.setBindGroup(0, particlesBatch.initializeColorsComputeBindgroup);
            computePass.setBindGroup(1, textureBindgroup);
            computePass.dispatch(particlesBatch.dispatchSize);
            computePass.end();
        }
    }
    buildComputeUniforms(dt, aspectRatio, force, attractors) {
        if (attractors.length > MAX_ATTRACTORS) {
            throw new Error(`Too many attractors (${attractors.length}, max is ${MAX_ATTRACTORS}).`);
        }
        const buffer = new ArrayBuffer(96);
        new Float32Array(buffer, 0, 2).set([force[0], force[1]]);
        new Float32Array(buffer, 8, 1).set([dt]);
        new Uint32Array(buffer, 12, 1).set([parameters_1.Parameters.bounce ? 1 : 0]);
        new Float32Array(buffer, 16, 1).set([parameters_1.Parameters.friction]);
        new Float32Array(buffer, 20, 1).set([aspectRatio]);
        new Uint32Array(buffer, 24, 1).set([attractors.length]);
        const attractorsData = [];
        for (const attractor of attractors) {
            attractorsData.push(attractor.position[0]);
            attractorsData.push(attractor.position[1]);
            attractorsData.push(attractor.force);
            attractorsData.push(0); // padding
        }
        new Float32Array(buffer, 32, attractorsData.length).set(attractorsData);
        return buffer;
    }
}
exports.Engine = Engine;
Engine.WORKGROUP_SIZE = 256;


/***/ }),

/***/ "./src/ts/helpers.ts":
/*!***************************!*\
  !*** ./src/ts/helpers.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bytesToString = void 0;
function bytesToString(bytes) {
    let quantity;
    let unit;
    if (bytes < 1024) {
        quantity = bytes;
        unit = "B";
    }
    else if (bytes < 1024 * 1024) {
        quantity = bytes / 1024;
        unit = "KB";
    }
    else {
        quantity = bytes / 1024 / 1024;
        unit = "MB";
    }
    return Math.ceil(quantity).toLocaleString() + " " + unit;
}
exports.bytesToString = bytesToString;


/***/ }),

/***/ "./src/ts/image.ts":
/*!*************************!*\
  !*** ./src/ts/image.ts ***!
  \*************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getTexture = exports.getSampler = void 0;
const WebGPU = __importStar(__webpack_require__(/*! ./webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
let linearSampler;
let texture;
async function getTexture(path) {
    if (!texture || texture.path !== path) {
        if (texture) {
            texture.gpuTexture.destroy();
        }
        const image = document.createElement("img");
        image.src = path;
        await image.decode();
        const imageBitmap = await createImageBitmap(image);
        const gpuTexture = WebGPU.device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT
        });
        WebGPU.device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture: gpuTexture }, [imageBitmap.width, imageBitmap.height]);
        texture = {
            path,
            gpuTexture
        };
    }
    return texture.gpuTexture;
}
exports.getTexture = getTexture;
function getSampler() {
    if (!linearSampler) {
        linearSampler = WebGPU.device.createSampler({
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            magFilter: "linear",
            minFilter: "linear",
        });
    }
    return linearSampler;
}
exports.getSampler = getSampler;


/***/ }),

/***/ "./src/ts/main.ts":
/*!************************!*\
  !*** ./src/ts/main.ts ***!
  \************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="./page-interface-generated" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const engine_1 = __webpack_require__(/*! ./engine */ "./src/ts/engine.ts");
const Image = __importStar(__webpack_require__(/*! ./image */ "./src/ts/image.ts"));
const parameters_1 = __webpack_require__(/*! ./parameters */ "./src/ts/parameters.ts");
const webgpu_canvas_1 = __webpack_require__(/*! ./webgpu-utils/webgpu-canvas */ "./src/ts/webgpu-utils/webgpu-canvas.ts");
const WebGPU = __importStar(__webpack_require__(/*! ./webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
const Attractors = __importStar(__webpack_require__(/*! ./attractors */ "./src/ts/attractors.ts"));
async function main() {
    await WebGPU.initialize();
    const device = WebGPU.device;
    const webgpuCanvas = new webgpu_canvas_1.WebGPUCanvas(Page.Canvas.getCanvas());
    const engine = new engine_1.Engine(webgpuCanvas.textureFormat);
    Attractors.setContainer(Page.Canvas.getCanvasContainer());
    let lastRun = performance.now();
    let needToReset = true;
    parameters_1.Parameters.resetObservers.push(() => { needToReset = true; });
    async function mainLoop() {
        const now = performance.now();
        const dt = parameters_1.Parameters.speed * Math.min(1 / 60, 0.001 * (now - lastRun));
        lastRun = now;
        const commandEncoder = device.createCommandEncoder();
        if (needToReset) {
            needToReset = false;
            engine.reset(parameters_1.Parameters.particlesCount);
            Page.Canvas.setIndicatorText("particles-count", engine.particlesCount.toLocaleString());
            if (parameters_1.Parameters.colorMode === parameters_1.ColorMode.MULTICOLOR) {
                const sampler = Image.getSampler();
                Page.Canvas.showLoader(true);
                const imageUrl = await parameters_1.Parameters.inputImageUrl();
                const image = await Image.getTexture(imageUrl);
                Page.Canvas.showLoader(false);
                engine.initializeColors(commandEncoder, sampler, image);
            }
        }
        webgpuCanvas.adjustSize();
        Attractors.update(dt);
        engine.update(commandEncoder, dt, webgpuCanvas.width / webgpuCanvas.height);
        const renderPassEncoder = commandEncoder.beginRenderPass(webgpuCanvas.getRenderPassDescriptor());
        webgpuCanvas.setFullcanvasViewport(renderPassEncoder);
        webgpuCanvas.setFullcanvasScissor(renderPassEncoder);
        engine.draw(webgpuCanvas.width, webgpuCanvas.height, renderPassEncoder);
        renderPassEncoder.end();
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(mainLoop);
    }
    requestAnimationFrame(mainLoop);
}
main();


/***/ }),

/***/ "./src/ts/parameters.ts":
/*!******************************!*\
  !*** ./src/ts/parameters.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="./page-interface-generated" />
/// <reference types="./webgpu-utils/image-type" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Parameters = exports.ColorSource = exports.ColorMode = exports.AttractorsPreset = void 0;
const ladybug_png_1 = __importDefault(__webpack_require__(/*! ../resources/ladybug.png */ "./src/resources/ladybug.png"));
const colors_png_1 = __importDefault(__webpack_require__(/*! ../resources/colors.png */ "./src/resources/colors.png"));
const controlId = {
    PARTICLES_COUNT_ID: "particles-count-range-id",
    SPEED_RANGE_ID: "speed-range-id",
    FRICTION_RANGE_ID: "friction-range-id",
    BOUNCE_CHECKBOX_ID: "bounce-checkbox-id",
    GRAVITY_RANGE_ID: "gravity-range-id",
    RESET_BUTTON_ID: "reset-button-id",
    ATTRACTION_RANGE_ID: "attraction-range-id",
    ATTRACTORS_PRESET_SELECT_ID: "attractors-preset-select-id",
    ATTRACTORS_DISPLAY_CHECKBOX_ID: "display-attractors-checkbox-id",
    COLOR_MODE_TABS_ID: "colors-mode-tabs-id",
    COLOR_AUTO_CHECKBOX_ID: "auto-color-checkbox-id",
    PARTICLE_COLORPICKER_ID: "particle-color-id",
    COLOR_SOURCE_TABS_ID: "color-source-tabs-id",
    IMAGE_SELECT_ID: "image-preset-select-id",
    IMAGE_UPLOAD_BUTTON_ID: "input-image-upload-button",
    SPRITE_SIZE_RANGE_ID: "sprite-size-range-id",
    BLENDING_CHECKBOX_ID: "blending-checkbox-id",
    OPACITY_RANGE_ID: "opacity-range-id",
    SHOW_INDICATORS_CHECKBOX_ID: "show-indicators-checkbox-id",
};
var AttractorsPreset;
(function (AttractorsPreset) {
    AttractorsPreset["NONE"] = "none";
    AttractorsPreset["ORBIT"] = "orbit";
    AttractorsPreset["SINES"] = "sines";
    AttractorsPreset["CENTRAL_ATTRACTIVE"] = "central-attractive";
    AttractorsPreset["CENTRAL_REPULSIVE"] = "central-repulsive";
})(AttractorsPreset || (AttractorsPreset = {}));
exports.AttractorsPreset = AttractorsPreset;
var ColorMode;
(function (ColorMode) {
    ColorMode["UNICOLOR"] = "unicolor";
    ColorMode["MULTICOLOR"] = "multicolor";
})(ColorMode || (ColorMode = {}));
exports.ColorMode = ColorMode;
var ColorSource;
(function (ColorSource) {
    ColorSource["IMAGE"] = "image";
    ColorSource["VELOCITY"] = "velocity";
})(ColorSource || (ColorSource = {}));
exports.ColorSource = ColorSource;
var ImagePreset;
(function (ImagePreset) {
    ImagePreset["COLORS"] = "colors";
    ImagePreset["LADYBUG"] = "ladybug";
})(ImagePreset || (ImagePreset = {}));
let customImageFile = null;
class Parameters {
    static get particlesCount() {
        return 1000000 * Page.Range.getValue(controlId.PARTICLES_COUNT_ID);
    }
    static get speed() {
        return Page.Range.getValue(controlId.SPEED_RANGE_ID);
    }
    static get friction() {
        return Page.Range.getValue(controlId.FRICTION_RANGE_ID);
    }
    static get bounce() {
        return Page.Checkbox.isChecked(controlId.BOUNCE_CHECKBOX_ID);
    }
    static get gravity() {
        return Page.Range.getValue(controlId.GRAVITY_RANGE_ID);
    }
    static get attraction() {
        return Page.Range.getValue(controlId.ATTRACTION_RANGE_ID);
    }
    static get attractorsPreset() {
        return Page.Select.getValue(controlId.ATTRACTORS_PRESET_SELECT_ID);
    }
    static get displayAttractors() {
        return Page.Checkbox.isChecked(controlId.ATTRACTORS_DISPLAY_CHECKBOX_ID);
    }
    static get colorMode() {
        return Page.Tabs.getValues(controlId.COLOR_MODE_TABS_ID)[0];
    }
    static get autoColor() {
        return Page.Checkbox.isChecked(controlId.COLOR_AUTO_CHECKBOX_ID);
    }
    static get particleColor() {
        if (Parameters.autoColor) {
            const cycleLength = 60000;
            const now = (performance.now() % cycleLength) / cycleLength * 6;
            const min = 0.2;
            let r = min, g = min, b = min;
            if (now < 1) {
                r = 1;
                g = min + (1 - min) * now;
            }
            else if (now < 2) {
                r = min + (1 - min) * (2 - now);
                g = 1;
            }
            else if (now < 3) {
                g = 1;
                b = min + (1 - min) * (now - 2);
            }
            else if (now < 4) {
                g = min + (1 - min) * (4 - now);
                b = 1;
            }
            else if (now < 5) {
                r = min + (1 - min) * (now - 4);
                b = 1;
            }
            else {
                r = 1;
                b = min + (1 - min) * (6 - now);
            }
            return [r, g, b];
        }
        else {
            const color = Page.ColorPicker.getValue(controlId.PARTICLE_COLORPICKER_ID);
            return [color.r / 255, color.g / 255, color.b / 255];
        }
    }
    static get colorSource() {
        return Page.Tabs.getValues(controlId.COLOR_SOURCE_TABS_ID)[0];
    }
    static async inputImageUrl() {
        if (customImageFile) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve(reader.result.toString());
                };
                reader.readAsDataURL(customImageFile);
            });
        }
        else {
            const imagePreset = Page.Select.getValue(controlId.IMAGE_SELECT_ID);
            if (imagePreset === ImagePreset.COLORS) {
                return colors_png_1.default;
            }
            else {
                return ladybug_png_1.default;
            }
        }
    }
    static get spriteSize() {
        return Page.Range.getValue(controlId.SPRITE_SIZE_RANGE_ID);
    }
    static get blending() {
        return Page.Checkbox.isChecked(controlId.BLENDING_CHECKBOX_ID);
    }
    static get opacity() {
        return Page.Range.getValue(controlId.OPACITY_RANGE_ID);
    }
}
exports.Parameters = Parameters;
Parameters.resetObservers = [];
Parameters.speedChangeObservers = [];
Page.Range.addObserver(controlId.SPEED_RANGE_ID, () => {
    for (const observer of Parameters.speedChangeObservers) {
        observer();
    }
});
function callResetObservers() {
    for (const observer of Parameters.resetObservers) {
        observer();
    }
}
function updateColorsVisibility() {
    const isUnicolor = (Parameters.colorMode === ColorMode.UNICOLOR);
    const imageColorSource = (Parameters.colorSource === ColorSource.IMAGE);
    Page.Controls.setVisibility(controlId.COLOR_AUTO_CHECKBOX_ID, isUnicolor);
    Page.Controls.setVisibility(controlId.PARTICLE_COLORPICKER_ID, isUnicolor && !Parameters.autoColor);
    Page.Controls.setVisibility(controlId.COLOR_SOURCE_TABS_ID, !isUnicolor);
    Page.Controls.setVisibility(controlId.IMAGE_SELECT_ID, !isUnicolor && imageColorSource);
    Page.Controls.setVisibility(controlId.IMAGE_UPLOAD_BUTTON_ID, !isUnicolor && imageColorSource);
}
Page.Range.addLazyObserver(controlId.PARTICLES_COUNT_ID, callResetObservers);
Page.Button.addObserver(controlId.RESET_BUTTON_ID, callResetObservers);
Page.Tabs.addObserver(controlId.COLOR_MODE_TABS_ID, () => {
    updateColorsVisibility();
    if (Parameters.colorMode === ColorMode.MULTICOLOR) {
        callResetObservers();
    }
});
Page.Checkbox.addObserver(controlId.COLOR_AUTO_CHECKBOX_ID, updateColorsVisibility);
Page.Tabs.addObserver(controlId.COLOR_SOURCE_TABS_ID, updateColorsVisibility);
Page.Select.addObserver(controlId.IMAGE_SELECT_ID, () => {
    customImageFile = null;
    Page.FileControl.clearFileUpload(controlId.IMAGE_UPLOAD_BUTTON_ID);
    callResetObservers();
});
Page.FileControl.addUploadObserver(controlId.IMAGE_UPLOAD_BUTTON_ID, (filesList) => {
    Page.Select.setValue(controlId.IMAGE_SELECT_ID, null);
    customImageFile = filesList[0];
    callResetObservers();
});
updateColorsVisibility();
Page.Checkbox.addObserver(controlId.SHOW_INDICATORS_CHECKBOX_ID, (show) => {
    Page.Canvas.setIndicatorsVisibility(show);
});
Page.Canvas.setIndicatorsVisibility(Page.Checkbox.isChecked(controlId.SHOW_INDICATORS_CHECKBOX_ID));
Page.Checkbox.addObserver(controlId.BLENDING_CHECKBOX_ID, (hasBlending) => {
    Page.Controls.setVisibility(controlId.OPACITY_RANGE_ID, hasBlending);
});
Page.Controls.setVisibility(controlId.OPACITY_RANGE_ID, Page.Checkbox.isChecked(controlId.BLENDING_CHECKBOX_ID));


/***/ }),

/***/ "./src/ts/render/renderer-instanced-monocolor.ts":
/*!*******************************************************!*\
  !*** ./src/ts/render/renderer-instanced-monocolor.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="../webgpu-utils/wgsl-type" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RendererInstancedMonocolor = void 0;
const draw_instanced_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/draw-instanced.wgsl */ "./src/shaders/draw-instanced.wgsl"));
const WebGPU = __importStar(__webpack_require__(/*! ../webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
const renderer_instanced_1 = __webpack_require__(/*! ./renderer-instanced */ "./src/ts/render/renderer-instanced.ts");
class RendererInstancedMonocolor extends renderer_instanced_1.RendererInstanced {
    constructor(targetTextureFormat) {
        super(targetTextureFormat);
        const shaderModule = WebGPU.device.createShaderModule({ code: draw_instanced_wgsl_1.default });
        this.createRenderPipelines({
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
                        stepMode: "instance",
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
                        stepMode: "vertex",
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-list",
            },
        });
    }
    draw(canvasWidth, canvasHeight, renderPassEncoder, particlesBatch) {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);
        const pipeline = this.pipeline;
        renderPassEncoder.setPipeline(pipeline.renderPipeline);
        renderPassEncoder.setBindGroup(0, pipeline.uniformsBindgroup);
        renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
        renderPassEncoder.setVertexBuffer(1, this.quadBuffer);
        renderPassEncoder.draw(6, particlesBatch.particlesCount, 0, 0);
    }
}
exports.RendererInstancedMonocolor = RendererInstancedMonocolor;


/***/ }),

/***/ "./src/ts/render/renderer-instanced-multicolor-velocity.ts":
/*!*****************************************************************!*\
  !*** ./src/ts/render/renderer-instanced-multicolor-velocity.ts ***!
  \*****************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="../webgpu-utils/wgsl-type" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RendererInstancedMulticolorVelocity = void 0;
const draw_instanced_multicolor_velocity_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/draw-instanced-multicolor-velocity.wgsl */ "./src/shaders/draw-instanced-multicolor-velocity.wgsl"));
const color_part_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/utils/color.part.wgsl */ "./src/shaders/utils/color.part.wgsl"));
const WebGPU = __importStar(__webpack_require__(/*! ../webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
const renderer_instanced_1 = __webpack_require__(/*! ./renderer-instanced */ "./src/ts/render/renderer-instanced.ts");
class RendererInstancedMulticolorVelocity extends renderer_instanced_1.RendererInstanced {
    constructor(targetTextureFormat) {
        super(targetTextureFormat);
        const shaderModule = WebGPU.device.createShaderModule({ code: color_part_wgsl_1.default + draw_instanced_multicolor_velocity_wgsl_1.default });
        this.createRenderPipelines({
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            },
                            {
                                shaderLocation: 1,
                                offset: Float32Array.BYTES_PER_ELEMENT * 2,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
                        stepMode: "instance",
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 2,
                                offset: 0,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
                        stepMode: "vertex",
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-list",
            },
        });
    }
    draw(canvasWidth, canvasHeight, renderPassEncoder, particlesBatch) {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);
        const pipeline = this.pipeline;
        renderPassEncoder.setPipeline(pipeline.renderPipeline);
        renderPassEncoder.setBindGroup(0, pipeline.uniformsBindgroup);
        renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
        renderPassEncoder.setVertexBuffer(1, this.quadBuffer);
        renderPassEncoder.draw(6, particlesBatch.particlesCount, 0, 0);
    }
}
exports.RendererInstancedMulticolorVelocity = RendererInstancedMulticolorVelocity;


/***/ }),

/***/ "./src/ts/render/renderer-instanced-multicolor.ts":
/*!********************************************************!*\
  !*** ./src/ts/render/renderer-instanced-multicolor.ts ***!
  \********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="../webgpu-utils/wgsl-type" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RendererInstancedMulticolor = void 0;
const draw_instanced_multicolor_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/draw-instanced-multicolor.wgsl */ "./src/shaders/draw-instanced-multicolor.wgsl"));
const color_part_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/utils/color.part.wgsl */ "./src/shaders/utils/color.part.wgsl"));
const WebGPU = __importStar(__webpack_require__(/*! ../webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
const renderer_instanced_1 = __webpack_require__(/*! ./renderer-instanced */ "./src/ts/render/renderer-instanced.ts");
class RendererInstancedMulticolor extends renderer_instanced_1.RendererInstanced {
    constructor(targetTextureFormat) {
        super(targetTextureFormat);
        const shaderModule = WebGPU.device.createShaderModule({ code: color_part_wgsl_1.default + draw_instanced_multicolor_wgsl_1.default });
        this.createRenderPipelines({
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
                        stepMode: "instance",
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
                        stepMode: "vertex",
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 2,
                                offset: 0,
                                format: "uint32",
                            }
                        ],
                        arrayStride: Uint32Array.BYTES_PER_ELEMENT,
                        stepMode: "instance",
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-list",
            },
        });
    }
    draw(canvasWidth, canvasHeight, renderPassEncoder, particlesBatch) {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);
        const pipeline = this.pipeline;
        renderPassEncoder.setPipeline(pipeline.renderPipeline);
        renderPassEncoder.setBindGroup(0, pipeline.uniformsBindgroup);
        renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
        renderPassEncoder.setVertexBuffer(1, this.quadBuffer);
        renderPassEncoder.setVertexBuffer(2, particlesBatch.colorsBuffer);
        renderPassEncoder.draw(6, particlesBatch.particlesCount, 0, 0);
    }
}
exports.RendererInstancedMulticolor = RendererInstancedMulticolor;


/***/ }),

/***/ "./src/ts/render/renderer-instanced.ts":
/*!*********************************************!*\
  !*** ./src/ts/render/renderer-instanced.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="../webgpu-utils/wgsl-type" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RendererInstanced = void 0;
const WebGPU = __importStar(__webpack_require__(/*! ../webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
const renderer_1 = __webpack_require__(/*! ./renderer */ "./src/ts/render/renderer.ts");
class RendererInstanced extends renderer_1.Renderer {
    constructor(targetTextureFormat) {
        super(targetTextureFormat);
        this.quadBuffer = WebGPU.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 2 * 6,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(this.quadBuffer.getMappedRange()).set([
            -1, -1, +1, -1, +1, +1,
            -1, -1, +1, +1, -1, +1
        ]);
        this.quadBuffer.unmap();
    }
}
exports.RendererInstanced = RendererInstanced;


/***/ }),

/***/ "./src/ts/render/renderer-monocolor.ts":
/*!*********************************************!*\
  !*** ./src/ts/render/renderer-monocolor.ts ***!
  \*********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="../webgpu-utils/wgsl-type" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RendererMonocolor = void 0;
const draw_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/draw.wgsl */ "./src/shaders/draw.wgsl"));
const WebGPU = __importStar(__webpack_require__(/*! ../webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
const renderer_1 = __webpack_require__(/*! ./renderer */ "./src/ts/render/renderer.ts");
class RendererMonocolor extends renderer_1.Renderer {
    constructor(targetTextureFormat) {
        super(targetTextureFormat);
        const shaderModule = WebGPU.device.createShaderModule({ code: draw_wgsl_1.default });
        this.createRenderPipelines({
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
                        stepMode: "vertex",
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [],
            },
            primitive: {
                cullMode: "none",
                topology: "point-list",
            },
        });
    }
    draw(canvasWidth, canvasHeight, renderPassEncoder, particlesBatch) {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);
        const pipeline = this.pipeline;
        renderPassEncoder.setPipeline(pipeline.renderPipeline);
        renderPassEncoder.setBindGroup(0, pipeline.uniformsBindgroup);
        renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
        renderPassEncoder.draw(particlesBatch.particlesCount, 1, 0, 0);
    }
}
exports.RendererMonocolor = RendererMonocolor;


/***/ }),

/***/ "./src/ts/render/renderer-multicolor-velocity.ts":
/*!*******************************************************!*\
  !*** ./src/ts/render/renderer-multicolor-velocity.ts ***!
  \*******************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="../webgpu-utils/wgsl-type" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RendererMulticolorVelocity = void 0;
const draw_multicolor_velocity_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/draw-multicolor-velocity.wgsl */ "./src/shaders/draw-multicolor-velocity.wgsl"));
const color_part_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/utils/color.part.wgsl */ "./src/shaders/utils/color.part.wgsl"));
const WebGPU = __importStar(__webpack_require__(/*! ../webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
const renderer_1 = __webpack_require__(/*! ./renderer */ "./src/ts/render/renderer.ts");
class RendererMulticolorVelocity extends renderer_1.Renderer {
    constructor(targetTextureFormat) {
        super(targetTextureFormat);
        const shaderModule = WebGPU.device.createShaderModule({ code: color_part_wgsl_1.default + draw_multicolor_velocity_wgsl_1.default });
        this.createRenderPipelines({
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            },
                            {
                                shaderLocation: 1,
                                offset: Float32Array.BYTES_PER_ELEMENT * 2,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
                        stepMode: "vertex",
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [],
            },
            primitive: {
                cullMode: "none",
                topology: "point-list",
            },
        });
    }
    draw(canvasWidth, canvasHeight, renderPassEncoder, particlesBatch) {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);
        const pipeline = this.pipeline;
        renderPassEncoder.setPipeline(pipeline.renderPipeline);
        renderPassEncoder.setBindGroup(0, pipeline.uniformsBindgroup);
        renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
        renderPassEncoder.draw(particlesBatch.particlesCount, 1, 0, 0);
    }
}
exports.RendererMulticolorVelocity = RendererMulticolorVelocity;


/***/ }),

/***/ "./src/ts/render/renderer-multicolor.ts":
/*!**********************************************!*\
  !*** ./src/ts/render/renderer-multicolor.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/// <reference types="../webgpu-utils/wgsl-type" />
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RendererMulticolor = void 0;
const draw_multicolor_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/draw-multicolor.wgsl */ "./src/shaders/draw-multicolor.wgsl"));
const color_part_wgsl_1 = __importDefault(__webpack_require__(/*! ../../shaders/utils/color.part.wgsl */ "./src/shaders/utils/color.part.wgsl"));
const WebGPU = __importStar(__webpack_require__(/*! ../webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
const renderer_1 = __webpack_require__(/*! ./renderer */ "./src/ts/render/renderer.ts");
class RendererMulticolor extends renderer_1.Renderer {
    constructor(targetTextureFormat) {
        super(targetTextureFormat);
        const shaderModule = WebGPU.device.createShaderModule({ code: color_part_wgsl_1.default + draw_multicolor_wgsl_1.default });
        this.createRenderPipelines({
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
                        stepMode: "vertex",
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: "uint32",
                            }
                        ],
                        arrayStride: Uint32Array.BYTES_PER_ELEMENT,
                        stepMode: "vertex",
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [],
            },
            primitive: {
                cullMode: "none",
                topology: "point-list",
            },
        });
    }
    draw(canvasWidth, canvasHeight, renderPassEncoder, particlesBatch) {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);
        const pipeline = this.pipeline;
        renderPassEncoder.setPipeline(pipeline.renderPipeline);
        renderPassEncoder.setBindGroup(0, pipeline.uniformsBindgroup);
        renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
        renderPassEncoder.setVertexBuffer(1, particlesBatch.colorsBuffer);
        renderPassEncoder.draw(particlesBatch.particlesCount, 1, 0, 0);
    }
}
exports.RendererMulticolor = RendererMulticolor;


/***/ }),

/***/ "./src/ts/render/renderer.ts":
/*!***********************************!*\
  !*** ./src/ts/render/renderer.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Renderer = void 0;
const parameters_1 = __webpack_require__(/*! ../parameters */ "./src/ts/parameters.ts");
const WebGPU = __importStar(__webpack_require__(/*! ../webgpu-utils/webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
class Renderer {
    constructor(targetTextureFormat) {
        this.targetTextureFormat = targetTextureFormat;
        this.uniformsBuffer = WebGPU.device.createBuffer({
            size: 24,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });
    }
    createRenderPipelines(descriptor) {
        descriptor.fragment.targets = [{
                format: this.targetTextureFormat
            }];
        this.pipelineNoBlending = this.createPipeline(descriptor);
        descriptor.fragment.targets = [{
                format: this.targetTextureFormat,
                blend: {
                    color: {
                        srcFactor: 'src-alpha',
                        dstFactor: 'one',
                        operation: 'add',
                    },
                    alpha: {
                        srcFactor: 'zero',
                        dstFactor: 'one',
                        operation: 'add',
                    }
                }
            }];
        this.pipelineAdditiveBlending = this.createPipeline(descriptor);
    }
    updateUniformsBuffer(canvasWidth, canvasHeight) {
        const color = parameters_1.Parameters.particleColor;
        const uniformsData = [color[0], color[1], color[2], parameters_1.Parameters.opacity, parameters_1.Parameters.spriteSize / canvasWidth, parameters_1.Parameters.spriteSize / canvasHeight];
        WebGPU.device.queue.writeBuffer(this.uniformsBuffer, 0, new Float32Array(uniformsData).buffer);
    }
    get pipeline() {
        if (parameters_1.Parameters.blending) {
            return this.pipelineAdditiveBlending;
        }
        else {
            return this.pipelineNoBlending;
        }
    }
    createPipeline(descriptor) {
        const pipeline = WebGPU.device.createRenderPipeline(descriptor);
        const uniformsBindgroup = WebGPU.device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformsBuffer,
                    }
                }
            ]
        });
        return { renderPipeline: pipeline, uniformsBindgroup };
    }
}
exports.Renderer = Renderer;


/***/ }),

/***/ "./src/ts/webgpu-utils/webgpu-canvas.ts":
/*!**********************************************!*\
  !*** ./src/ts/webgpu-utils/webgpu-canvas.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebGPUCanvas = void 0;
const WebGPU = __importStar(__webpack_require__(/*! ./webgpu-device */ "./src/ts/webgpu-utils/webgpu-device.ts"));
class WebGPUCanvas {
    constructor(canvas) {
        this.canvas = canvas;
        this.devicePixelRatio = window.devicePixelRatio;
        const contextName = "webgpu";
        this.context = canvas.getContext(contextName);
        if (!this.context) {
            throw new Error(`Failed to get a '${contextName}' context from canvas.`);
        }
        this.canvasConfiguration = {
            device: WebGPU.device,
            format: this.context.getPreferredFormat(WebGPU.adapter),
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            // no "size" attribute to use the canvas' width and height
        };
        this.context.configure(this.canvasConfiguration);
        this.textureFormat = this.canvasConfiguration.format;
        this.clearColor = { r: 0, g: 0, b: 0, a: 1 };
    }
    get width() {
        return this.canvas.width;
    }
    get height() {
        return this.canvas.height;
    }
    adjustSize() {
        const actualWidth = Math.floor(this.devicePixelRatio * this.canvas.clientWidth);
        const actualHeight = Math.floor(this.devicePixelRatio * this.canvas.clientHeight);
        if (this.canvas.width !== actualWidth || this.canvas.height !== actualHeight) {
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;
            this.context.configure(this.canvasConfiguration);
        }
    }
    getRenderPassDescriptor() {
        const colorAttachment = {
            view: this.context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: this.clearColor,
            storeOp: 'store'
        };
        const renderPassDesc = {
            colorAttachments: [colorAttachment],
        };
        return renderPassDesc;
    }
    setFullcanvasViewport(renderPassEncoder) {
        renderPassEncoder.setViewport(0, 0, this.width, this.height, 0, 1);
    }
    setFullcanvasScissor(renderPassEncoder) {
        renderPassEncoder.setScissorRect(0, 0, this.width, this.height);
    }
}
exports.WebGPUCanvas = WebGPUCanvas;


/***/ }),

/***/ "./src/ts/webgpu-utils/webgpu-device.ts":
/*!**********************************************!*\
  !*** ./src/ts/webgpu-utils/webgpu-device.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports) => {


/// <reference types="../page-interface-generated" />
/// <reference types="@webgpu/types" />
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.initialize = exports.gpu = exports.device = exports.adapter = void 0;
function throwAndDisplayException(id, message) {
    Page.Demopage.setErrorMessage(id, message);
    Page.Canvas.toggleFullscreen(false);
    throw new Error(message);
}
const gpu = navigator.gpu;
exports.gpu = gpu;
if (!gpu) {
    throwAndDisplayException("webgpu-support", "Your browser does not seem to support WebGPU.");
}
let adapter = null;
exports.adapter = adapter;
let device = null;
exports.device = device;
async function requestDevice() {
    if (!device) {
        exports.adapter = adapter = await gpu.requestAdapter({
            powerPreference: "high-performance"
        });
        if (!adapter) {
            throwAndDisplayException("webgpu-adapter", "Request for GPU adapter failed.");
        }
        if (adapter.isFallbackAdapter) {
            Page.Demopage.setErrorMessage("webgpu-is-fallback", "The retrieved GPU adapter is fallback. The performance might be degraded.");
        }
        exports.device = device = await adapter.requestDevice();
    }
}
exports.initialize = requestDevice;


/***/ }),

/***/ "./src/resources/colors.png":
/*!**********************************!*\
  !*** ./src/resources/colors.png ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "..\\rc\\images\\b7a8198c185b8b92aebb.png";

/***/ }),

/***/ "./src/resources/ladybug.png":
/*!***********************************!*\
  !*** ./src/resources/ladybug.png ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "..\\rc\\images\\a17685859ad122820967.png";

/***/ }),

/***/ "./src/shaders/draw-instanced-multicolor-velocity.wgsl":
/*!*************************************************************!*\
  !*** ./src/shaders/draw-instanced-multicolor-velocity.wgsl ***!
  \*************************************************************/
/***/ ((module) => {

module.exports = "struct Uniforms {             //             align(16)  size(24)\r\n    color: vec4<f32>;         // offset(0)   align(16)  size(16)\r\n    spriteSize: vec2<f32>;    // offset(16)   align(8)  size(8)\r\n};\r\n\r\nstruct VertexOutput {\r\n    @builtin(position) position: vec4<f32>;\r\n    @location(0) localPosition: vec2<f32>; // in {-1, +1}^2\r\n    @location(1) @interpolate(flat) color: vec4<f32>;\r\n};\r\n\r\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r\n\r\n@stage(vertex)\r\nfn main_vertex(@location(0) inPosition: vec2<f32>, @location(1) inVelocity: vec2<f32>, @location(2) quadCorner: vec2<f32>) -> VertexOutput {\r\n    var vsOut: VertexOutput;\r\n    vsOut.position = vec4<f32>(inPosition + uniforms.spriteSize * quadCorner, 0.0, 1.0);\r\n    vsOut.position.y = -vsOut.position.y;\r\n    vsOut.localPosition = quadCorner;\r\n    vsOut.color = colorFromVelocity(inVelocity, uniforms.color.a);\r\n    return vsOut;\r\n}\r\n\r\n@stage(fragment)\r\nfn main_fragment(@location(0) localPosition: vec2<f32>, @location(1) @interpolate(flat) color: vec4<f32>) -> @location(0) vec4<f32> {\r\n    let distanceFromCenter: f32 = length(localPosition);\r\n    if (distanceFromCenter > 1.0) {\r\n        discard;\r\n    }\r\n\r\n    return color;\r\n}\r\n";

/***/ }),

/***/ "./src/shaders/draw-instanced-multicolor.wgsl":
/*!****************************************************!*\
  !*** ./src/shaders/draw-instanced-multicolor.wgsl ***!
  \****************************************************/
/***/ ((module) => {

module.exports = "struct Uniforms {             //             align(16)  size(24)\r\n    color: vec4<f32>;         // offset(0)   align(16)  size(16)\r\n    spriteSize: vec2<f32>;    // offset(16)   align(8)  size(8)\r\n};\r\n\r\nstruct VertexOutput {\r\n    @builtin(position) position: vec4<f32>;\r\n    @location(0) localPosition: vec2<f32>; // in {-1, +1}^2\r\n    @location(1) @interpolate(flat) color: u32;\r\n};\r\n\r\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r\n\r\n@stage(vertex)\r\nfn main_vertex(@location(0) inPosition: vec2<f32>, @location(1) quadCorner: vec2<f32>, @location(2) inColor: u32) -> VertexOutput {\r\n    var vsOut: VertexOutput;\r\n    vsOut.position = vec4<f32>(inPosition + uniforms.spriteSize * quadCorner, 0.0, 1.0);\r\n    vsOut.position.y = -vsOut.position.y;\r\n    vsOut.localPosition = quadCorner;\r\n    vsOut.color = inColor;\r\n    return vsOut;\r\n}\r\n\r\n@stage(fragment)\r\nfn main_fragment(@location(0) localPosition: vec2<f32>, @location(1) @interpolate(flat) color: u32) -> @location(0) vec4<f32> {\r\n    let distanceFromCenter: f32 = length(localPosition);\r\n    if (distanceFromCenter > 1.0) {\r\n        discard;\r\n    }\r\n\r\n    return unpackColor(color, uniforms.color.a);\r\n}\r\n";

/***/ }),

/***/ "./src/shaders/draw-instanced.wgsl":
/*!*****************************************!*\
  !*** ./src/shaders/draw-instanced.wgsl ***!
  \*****************************************/
/***/ ((module) => {

module.exports = "struct Uniforms {             //             align(16)  size(24)\r\n    color: vec4<f32>;         // offset(0)   align(16)  size(16)\r\n    spriteSize: vec2<f32>;    // offset(16)   align(8)  size(8)\r\n};\r\n\r\nstruct VSOut {\r\n    @builtin(position) position: vec4<f32>;\r\n    @location(0) localPosition: vec2<f32>; // in {-1, +1}^2\r\n};\r\n\r\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r\n\r\n@stage(vertex)\r\nfn main_vertex(@location(0) inPosition: vec2<f32>, @location(1) quadCorner: vec2<f32>) -> VSOut {\r\n    var vsOut: VSOut;\r\n    vsOut.position = vec4<f32>(inPosition + uniforms.spriteSize * quadCorner, 0.0, 1.0);\r\n    vsOut.position.y = -vsOut.position.y;\r\n    vsOut.localPosition = quadCorner;\r\n    return vsOut;\r\n}\r\n\r\n@stage(fragment)\r\nfn main_fragment(@location(0) localPosition: vec2<f32>) -> @location(0) vec4<f32> {\r\n    let distanceFromCenter: f32 = length(localPosition);\r\n    if (distanceFromCenter > 1.0) {\r\n        discard;\r\n    }\r\n\r\n    return vec4<f32>(uniforms.color.rgb, uniforms.color.a);\r\n}\r\n";

/***/ }),

/***/ "./src/shaders/draw-multicolor-velocity.wgsl":
/*!***************************************************!*\
  !*** ./src/shaders/draw-multicolor-velocity.wgsl ***!
  \***************************************************/
/***/ ((module) => {

module.exports = "struct VSOut {\r\n    @builtin(position) position: vec4<f32>;\r\n    @location(0) @interpolate(flat) color: vec4<f32>;\r\n};\r\n\r\nstruct Uniforms {             //             align(16)  size(16)\r\n    color: vec4<f32>;         // offset(0)   align(16)  size(16)\r\n};\r\n\r\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r\n\r\n@stage(vertex)\r\nfn main_vertex(@location(0) inPosition: vec2<f32>, @location(1) inVelocity: vec2<f32>) -> VSOut {\r\n    var output: VSOut;\r\n    output.position = vec4<f32>(inPosition.x, -inPosition.y, 0.0, 1.0);\r\n    output.color = colorFromVelocity(inVelocity, uniforms.color.a);\r\n    return output;\r\n}\r\n\r\n@stage(fragment)\r\nfn main_fragment(@location(0) @interpolate(flat) color: vec4<f32>) -> @location(0) vec4<f32> {\r\n    return color;\r\n}\r\n";

/***/ }),

/***/ "./src/shaders/draw-multicolor.wgsl":
/*!******************************************!*\
  !*** ./src/shaders/draw-multicolor.wgsl ***!
  \******************************************/
/***/ ((module) => {

module.exports = "struct VSOut {\r\n    @builtin(position) position: vec4<f32>;\r\n    @location(0) @interpolate(flat) color: u32;\r\n};\r\n\r\n@stage(vertex)\r\nfn main_vertex(@location(0) inPosition: vec2<f32>, @location(1) inColor: u32) -> VSOut {\r\n    var output: VSOut;\r\n    output.position = vec4<f32>(inPosition.x, -inPosition.y, 0.0, 1.0);\r\n    output.color = inColor;\r\n    return output;\r\n}\r\n\r\nstruct Uniforms {             //             align(16)  size(16)\r\n    color: vec4<f32>;         // offset(0)   align(16)  size(16)\r\n};\r\n\r\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r\n\r\n@stage(fragment)\r\nfn main_fragment(@location(0) @interpolate(flat) color: u32) -> @location(0) vec4<f32> {\r\n    return unpackColor(color, uniforms.color.a);\r\n}\r\n";

/***/ }),

/***/ "./src/shaders/draw.wgsl":
/*!*******************************!*\
  !*** ./src/shaders/draw.wgsl ***!
  \*******************************/
/***/ ((module) => {

module.exports = "@stage(vertex)\r\nfn main_vertex(@location(0) inPosition: vec2<f32>) -> @builtin(position) vec4<f32> {\r\n    return vec4<f32>(inPosition.x, -inPosition.y, 0.0, 1.0);\r\n}\r\n\r\nstruct Uniforms {             //             align(16)  size(16)\r\n    color: vec4<f32>;         // offset(0)   align(16)  size(16)\r\n};\r\n\r\n@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r\n\r\n@stage(fragment)\r\nfn main_fragment() -> @location(0) vec4<f32> {\r\n    return vec4<f32>(uniforms.color);\r\n}\r\n";

/***/ }),

/***/ "./src/shaders/initialize-colors.wgsl":
/*!********************************************!*\
  !*** ./src/shaders/initialize-colors.wgsl ***!
  \********************************************/
/***/ ((module) => {

module.exports = "struct Particle {\r\n    position: vec2<f32>;\r\n    velocity: vec2<f32>;\r\n};\r\n\r\nstruct ParticlesBuffer {\r\n    particles: array<Particle>;\r\n};\r\n\r\nstruct ColorsBuffer {\r\n    color: array<u32>;\r\n};\r\n\r\n@group(0) @binding(0) var<storage,read> particlesStorage: ParticlesBuffer;\r\n@group(0) @binding(1) var<storage,write> colorsStorage: ColorsBuffer;\r\n@group(1) @binding(0) var inputSampler : sampler;\r\n@group(1) @binding(1) var inputTexture: texture_2d<f32>;\r\n\r\n@stage(compute) @workgroup_size(256)\r\nfn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {\r\n    let index: u32 = GlobalInvocationID.x;\r\n    let inputTextureDimensions : vec2<i32> = textureDimensions(inputTexture, 0);\r\n\r\n    let uv = 0.5 + 0.5 * particlesStorage.particles[index].position;\r\n    let color = textureSampleLevel(inputTexture, inputSampler, uv, 0.0).rgb;\r\n    colorsStorage.color[index] = packColor(color);\r\n}\r\n";

/***/ }),

/***/ "./src/shaders/update.wgsl":
/*!*********************************!*\
  !*** ./src/shaders/update.wgsl ***!
  \*********************************/
/***/ ((module) => {

module.exports = "struct Particle {\r\n    position: vec2<f32>;\r\n    velocity: vec2<f32>;\r\n};\r\n\r\nstruct ParticlesBuffer {\r\n    particles: array<Particle>;\r\n};\r\n\r\nstruct Attractor {                                 //             align(8)  size(16)\r\n    position: vec2<f32>;                           // offset(0)   align(8)  size(8)\r\n    force: f32;                                    // offset(8)   align(4)  size(4)\r\n    // -- implicit padding --                      // offset(12)            size(4)\r\n};\r\n\r\nstruct Uniforms {                                  //             align(8)  size(48)\r\n    force: vec2<f32>;                              // offset(0)   align(8)  size(8)\r\n    dt: f32;                                       // offset(8)   align(4)  size(4)\r\n    bounce: u32;                                   // offset(12)  align(4)  size(4)\r\n\r\n    friction: f32;                                 // offset(16)  align(4)  size(4)\r\n    aspectRatio: f32;                              // offset(20)  align(4)  size(4)\r\n    attractorsCount: u32;                          // offset(24)  align(4)  size(4)\r\n    // -- implicit padding --                      // offset(28)            size(4)\r\n    @align(16) attractors: array<Attractor, 4>;    // offset(32)  align(16) size(16) stride(16)\r\n};\r\n\r\n@group(0) @binding(0) var<storage,read_write> particlesStorage: ParticlesBuffer;\r\n@group(0) @binding(1) var<uniform> uniforms: Uniforms;\r\n\r\n@stage(compute) @workgroup_size(256)\r\nfn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {\r\n    let index: u32 = GlobalInvocationID.x;\r\n\r\n    var particle = particlesStorage.particles[index];\r\n\r\n    let applyAspectRatio = vec2<f32>(uniforms.aspectRatio, 1.0);\r\n\r\n    var force: vec2<f32> = uniforms.force * applyAspectRatio;\r\n    for (var i = 0u; i < uniforms.attractorsCount; i = i + 1u) {\r\n        var toAttractor: vec2<f32> = (uniforms.attractors[i].position - particle.position) * applyAspectRatio;\r\n        let squaredDistance: f32 = dot(toAttractor, toAttractor);\r\n        force = force + uniforms.attractors[i].force * toAttractor / (squaredDistance + 0.01);\r\n    }\r\n\r\n    particle.velocity = uniforms.friction * (particle.velocity + uniforms.dt * force);\r\n    particle.position = particle.position + uniforms.dt * particle.velocity / applyAspectRatio;\r\n\r\n    if (uniforms.bounce != 0u) {\r\n        if (particle.position.x < -1.0) {\r\n            particle.position.x = -2.0 - particle.position.x;\r\n            particle.velocity.x = -particle.velocity.x;\r\n        }\r\n        if (particle.position.y < -1.0) {\r\n            particle.position.y = -2.0 - particle.position.y;\r\n            particle.velocity.y = -particle.velocity.y;\r\n        }\r\n\r\n        if (particle.position.x > 1.0) {\r\n            particle.position.x = 2.0 - particle.position.x;\r\n            particle.velocity.x = -particle.velocity.x;\r\n        }\r\n        if (particle.position.y > 1.0) {\r\n            particle.position.y = 2.0 - particle.position.y;\r\n            particle.velocity.y = -particle.velocity.y;\r\n        }\r\n    }\r\n\r\n    particlesStorage.particles[index] = particle;\r\n}\r\n";

/***/ }),

/***/ "./src/shaders/utils/color.part.wgsl":
/*!*******************************************!*\
  !*** ./src/shaders/utils/color.part.wgsl ***!
  \*******************************************/
/***/ ((module) => {

module.exports = "fn unpackColor(packed: u32, alpha: f32) -> vec4<f32> {\r\n    return vec4<f32>(unpack4x8unorm(packed).rgb, alpha);\r\n}\r\n\r\nfn packColor(color: vec3<f32>) -> u32 {\r\n    return pack4x8unorm(vec4<f32>(color, 1.0));\r\n}\r\n\r\nfn colorFromHue(normalizedHue: f32, alpha: f32) -> vec4<f32> {\r\n    let value = normalizedHue * 6.0;\r\n    if (value < 1.0) {\r\n        return vec4<f32>(1.0, value, 0.0, alpha);\r\n    } else if (value < 2.0) {\r\n        return vec4<f32>(2.0 - value, 1.0, 0.0, alpha);\r\n    } else if (value < 3.0) {\r\n        return vec4<f32>(0.0, 1.0, value - 2.0, alpha);\r\n    } else if (value < 4.0) {\r\n        return vec4<f32>(0.0, 4.0 - value, 1.0, alpha);\r\n    } else if (value < 5.0) {\r\n        return vec4<f32>(value - 4.0, 0.0, 1.0, alpha);\r\n    }\r\n    return vec4<f32>(1.0, 0.0, 6.0 - value, alpha);\r\n}\r\n\r\nfn colorFromVelocity(velocity: vec2<f32>, alpha: f32) -> vec4<f32> {\r\n    let normalizedHue: f32 = 0.5 + 0.5 * atan2(velocity.y, velocity.x) / 3.14159;\r\n    return colorFromHue(normalizedHue, alpha);\r\n}\r\n";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/ts/main.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map