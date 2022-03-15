import { WebGPUCanvas } from "../webgpu-utils/webgpu-canvas";
import { Composition } from "./composition";
import { IRenderer } from "./i-renderer";
import { RendererInstancedMonocolor } from "./renderer-instanced-monocolor";
import { RendererMonocolor } from "./renderer-monocolor";

type RenderableParticlesBatch = {
    gpuBuffer: GPUBuffer;
    particlesCount: number;
}

// Rather than accumulating directly particles color,
// this renderer uses deferred rendering to:
// - first count the particles count per pixel (render to texture with additive blending)
// - then compute the final color during compositing.
abstract class RendererHighQuality implements IRenderer {
    public particleColor: [number, number, number] = [0, 0, 0];
    public particleOpacity: number = 1;
    public enableAdditiveBlending: boolean = true;
    public spriteSize: number = 2;

    protected abstract readonly renderer: RendererMonocolor | RendererInstancedMonocolor;
    protected readonly composition: Composition;

    protected constructor(targetTextureFormat: GPUTextureFormat) {
        this.composition = new Composition(targetTextureFormat);
    }

    public draw(commandEncoder: GPUCommandEncoder, webgpuCanvas: WebGPUCanvas, particlesBatches: RenderableParticlesBatch[]): void {
        this.renderToTexture(commandEncoder, webgpuCanvas, particlesBatches);
        this.applyComposition(commandEncoder, webgpuCanvas);
    }

    private renderToTexture(commandEncoder: GPUCommandEncoder, webgpuCanvas: WebGPUCanvas, particlesBatches: RenderableParticlesBatch[]): void {
        this.renderer.particleColor = [1 / 255, 0, 0];
        this.renderer.particleOpacity = 1;
        this.renderer.enableAdditiveBlending = true;
        this.renderer.spriteSize = this.spriteSize;

        const textureRenderPassEncoder = this.composition.getRenderToTexturePassEncoder(commandEncoder, webgpuCanvas);
        this.renderer.drawInternal(textureRenderPassEncoder, webgpuCanvas.width, webgpuCanvas.height, particlesBatches);
        textureRenderPassEncoder.end();
    }

    private applyComposition(commandEncoder: GPUCommandEncoder, webgpuCanvas: WebGPUCanvas): void {
        this.composition.apply(commandEncoder, webgpuCanvas);
    }
}

export {
    RendererHighQuality,
};
