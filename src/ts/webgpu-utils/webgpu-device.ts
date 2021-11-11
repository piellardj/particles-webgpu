/// <reference types="../page-interface-generated" />
/// <reference types="@webgpu/types" />

function throwAndDisplayException(id: string, message: string): void {
    Page.Demopage.setErrorMessage(id, message);
    Page.Canvas.toggleFullscreen(false);
    throw new Error(message);
}

const gpu: GPU = navigator.gpu;
if (!gpu) {
    throwAndDisplayException("webgpu-support", "Your browser does not seem to support WebGPU.");
}

let adapter: GPUAdapter | null = null;
let device: GPUDevice | null = null;

async function requestDevice(): Promise<void> {
    if (!device) {
        adapter = await gpu.requestAdapter();
        if (!adapter) {
            throwAndDisplayException("webgpu-adapter", "Request for GPU adapter failed.");
        }
        if (adapter.isSoftware) {
            Page.Demopage.setErrorMessage("webgpu-is-software", "The retrieved GPU adapter is software. The performance might be degraded.");
        }
        device = await adapter.requestDevice();
    }
}

export {
    adapter,
    device,
    gpu,
    requestDevice as initialize,
};
