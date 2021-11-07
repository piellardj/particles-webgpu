import { Engine } from "./engine";
import * as WebGPU from "./webgpu-utils/webgpu-device";
import { WebGPUCanvas } from "./webgpu-utils/webgpu-canvas";
import { Parameters } from "./parameters";

// import "./page-interface-generated";

async function main(): Promise<void> {
    await WebGPU.initialize();
    const device = WebGPU.device as GPUDevice;
    const webgpuCanvas = new WebGPUCanvas(Page.Canvas.getCanvas());
    const engine = new Engine(webgpuCanvas.textureFormat);

    let lastRun = performance.now();

    let needToReset = true;
    Parameters.resetObservers.push(() => { needToReset = true; });

    function mainLoop(): void {
        const now = performance.now();
        const dt = 0.001 * (now - lastRun);
        lastRun = now;

        if (needToReset) {
            needToReset = false;
            engine.reset(Parameters.particlesCount);
            Page.Canvas.setIndicatorText("particles-count", engine.particlesCount.toFixed());
        }

        webgpuCanvas.adjustSize();

        const commandEncoder = device.createCommandEncoder();
        engine.update(commandEncoder, dt * Parameters.speed, webgpuCanvas.width / webgpuCanvas.height);

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
