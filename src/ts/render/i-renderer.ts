import { WebGPUCanvas } from "../webgpu-utils/webgpu-canvas";

type RenderableParticlesBatch = {
    gpuBuffer: GPUBuffer;
    colorsBuffer: GPUBuffer;
    particlesCount: number;
}

interface IRenderer {
    particleColor: [number, number, number];
    particleOpacity: number;
    enableAdditiveBlending: boolean;
    spriteSize: number;

    draw(commandEncoder: GPUCommandEncoder, webgpuCanvas: WebGPUCanvas, particleBatches: RenderableParticlesBatch[]): void;
}

export type {
    IRenderer,
    RenderableParticlesBatch,
};
