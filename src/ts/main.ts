/// <reference types="./page-interface-generated" />

import { Engine } from "./engine";
import * as Image from "./image";
import { ColorMode, Parameters } from "./parameters";
import { WebGPUCanvas } from "./webgpu-utils/webgpu-canvas";
import * as WebGPU from "./webgpu-utils/webgpu-device";
import * as Attractors from "./attractors";

async function main(canvas: HTMLCanvasElement, canvasContainer: HTMLElement): Promise<void> {
    await WebGPU.initialize();
    const device = WebGPU.device as GPUDevice;
    const webgpuCanvas = new WebGPUCanvas(canvas);
    const engine = new Engine(webgpuCanvas.textureFormat);
    Attractors.setContainer(canvasContainer);

    let lastRun = performance.now();

    let needToReset = true;
    Parameters.resetObservers.push(() => { needToReset = true; });

    async function mainLoop(): Promise<void> {
        const now = performance.now();
        const dt = Parameters.speed * Math.min(1 / 60, 0.001 * (now - lastRun));
        lastRun = now;

        const commandEncoder = device.createCommandEncoder();

        if (needToReset) {
            needToReset = false;
            engine.reset(Parameters.particlesCount);
            Page.Canvas.setIndicatorText("particles-count", engine.particlesCount.toLocaleString());

            if (Parameters.colorMode === ColorMode.MULTICOLOR) {
                const sampler = Image.getSampler();
                Page.Canvas.showLoader(true);
                const imageUrl = await Parameters.inputImageUrl();
                const image = await Image.getTexture(imageUrl);
                Page.Canvas.showLoader(false);
                engine.initializeColors(commandEncoder, sampler, image);
            }
        }

        webgpuCanvas.adjustSize();

        Attractors.update(dt);
        engine.update(commandEncoder, dt, webgpuCanvas.width / webgpuCanvas.height);
        engine.draw(commandEncoder, webgpuCanvas);

        device.queue.submit([commandEncoder.finish()]);

        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);
}

const canvasElement = Page.Canvas.getCanvas();
const canvasContainer = Page.Canvas.getCanvasContainer();
if (!canvasElement || !canvasContainer) {
    throw new Error("Could not find canvas on page.");
}
main(canvasElement, canvasContainer);
