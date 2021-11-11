/// <reference types="./page-interface-generated" />

import { Engine } from "./engine";
import * as Image from "./image";
import { ColorMode, Parameters } from "./parameters";
import { WebGPUCanvas } from "./webgpu-utils/webgpu-canvas";
import * as WebGPU from "./webgpu-utils/webgpu-device";
import * as Attractors from "./attractors";
import { getTime } from "./time";

async function main(): Promise<void> {
    await WebGPU.initialize();
    const device = WebGPU.device as GPUDevice;
    const webgpuCanvas = new WebGPUCanvas(Page.Canvas.getCanvas());
    const engine = new Engine(webgpuCanvas.textureFormat);
    Attractors.setContainer(Page.Canvas.getCanvasContainer());

    let lastRun = getTime();

    let needToReset = true;
    Parameters.resetObservers.push(() => { needToReset = true; });

    async function mainLoop(): Promise<void> {
        const now = getTime();
        const dt = 0.001 * (now - lastRun);
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

        engine.update(commandEncoder, dt, webgpuCanvas.width / webgpuCanvas.height);

        const renderPassEncoder = commandEncoder.beginRenderPass(webgpuCanvas.getRenderPassDescriptor());
        webgpuCanvas.setFullcanvasViewport(renderPassEncoder);
        webgpuCanvas.setFullcanvasScissor(renderPassEncoder);
        engine.draw(webgpuCanvas.width, webgpuCanvas.height, renderPassEncoder);
        renderPassEncoder.endPass();

        device.queue.submit([commandEncoder.finish()]);

        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);
}

main();
