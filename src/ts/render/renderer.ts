import { WebGPUCanvas } from "../webgpu-utils/webgpu-canvas";
import * as WebGPU from "../webgpu-utils/webgpu-device";
import { IRenderer, RenderableParticlesBatch } from "./i-renderer";

type Pipeline = {
    renderPipeline: GPURenderPipeline;
    uniformsBindgroup: GPUBindGroup;
}

abstract class Renderer implements IRenderer {
    public particleColor: [number, number, number] = [0, 0, 0];
    public particleOpacity: number = 1;
    public enableAdditiveBlending: boolean = true;
    public spriteSize: number = 2;

    private readonly uniformsBuffer: GPUBuffer;

    private pipelineAdditiveBlending: Pipeline;
    private pipelineNoBlending: Pipeline;

    protected constructor(private readonly targetTextureFormat: GPUTextureFormat) {
        this.uniformsBuffer = WebGPU.device.createBuffer({
            size: 24,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });
    }

    public draw(commandEncoder: GPUCommandEncoder, webgpuCanvas: WebGPUCanvas, particleBatches: RenderableParticlesBatch[]): void {
        const renderPassEncoder = webgpuCanvas.beginRenderPass(commandEncoder);
        this.drawInternal(renderPassEncoder, webgpuCanvas.width, webgpuCanvas.height, particleBatches);
        renderPassEncoder.end();
    }

    public abstract drawInternal(renderPassEncoder: GPURenderPassEncoder, canvasWidth: number, canvasHeight: number, particleBatches: RenderableParticlesBatch[]): void;

    protected createRenderPipelines(descriptor: GPURenderPipelineDescriptor): void {
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

    protected updateUniformsBuffer(canvasWidth: number, canvasHeight: number): void {
        const uniformsData = [this.particleColor[0], this.particleColor[1], this.particleColor[2], this.particleOpacity, this.spriteSize / canvasWidth, this.spriteSize / canvasHeight];
        WebGPU.device.queue.writeBuffer(this.uniformsBuffer, 0, new Float32Array(uniformsData).buffer);
    }

    protected get pipeline(): Pipeline {
        if (this.enableAdditiveBlending) {
            return this.pipelineAdditiveBlending;
        } else {
            return this.pipelineNoBlending;
        }
    }

    private createPipeline(descriptor: GPURenderPipelineDescriptor): Pipeline {
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

export {
    Renderer,
};
