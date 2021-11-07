import { Engine } from "./engine";
import * as WebGPU from "./webgpu-utils/webgpu-device";
import { WebGPUCanvas } from "./webgpu-utils/webgpu-canvas";

// import "./page-interface-generated";

async function main(): Promise<void> {
    await WebGPU.initialize();
    const device = WebGPU.device as GPUDevice;
    const webgpuCanvas = new WebGPUCanvas(Page.Canvas.getCanvas());
    const engine = new Engine(webgpuCanvas.textureFormat);

    let needToReset = true;
    function mainLoop(): void {
        if (needToReset) {
            needToReset = false;
            const particlesCount = 1000;
            engine.reset(particlesCount);
            Page.Canvas.setIndicatorText("particles-count", engine.particlesCount.toFixed());
        }

        webgpuCanvas.adjustSize();

        const commandEncoder = device.createCommandEncoder();
        engine.update(commandEncoder);

        const renderPassEncoder = commandEncoder.beginRenderPass(webgpuCanvas.getRenderPassDescriptor());
        webgpuCanvas.setFullcanvasViewport(renderPassEncoder);
        webgpuCanvas.setFullcanvasScissor(renderPassEncoder);
        engine.draw(renderPassEncoder);
        renderPassEncoder.endPass();

        device.queue.submit([commandEncoder.finish()]);

        requestAnimationFrame(mainLoop);
    }

    requestAnimationFrame(mainLoop);
}

main();
