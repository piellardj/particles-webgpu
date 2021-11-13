import { Parameters } from "../parameters";
import * as WebGPU from "../webgpu-utils/webgpu-device";

type Pipeline = {
    renderPipeline: GPURenderPipeline;
    uniformsBindgroup: GPUBindGroup;
}

type RenderableParticlesBatch = {
    gpuBuffer: GPUBuffer;
    colorsBuffer: GPUBuffer;
    particlesCount: number;
}

abstract class Renderer {
    private readonly uniformsBuffer: GPUBuffer;

    private pipelineAdditiveBlending: Pipeline;
    private pipelineNoBlending: Pipeline;

    protected constructor(private readonly targetTextureFormat: GPUTextureFormat) {
        this.uniformsBuffer = WebGPU.device.createBuffer({
            size: 24,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });
    }

    public abstract draw(canvasWidth: number, canvasHeight: number, renderPassEncoder: GPURenderPassEncoder, particlesBatch: RenderableParticlesBatch): void;

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
        const color = Parameters.particleColor;
        const uniformsData = [color[0], color[1], color[2], Parameters.opacity, Parameters.spriteSize / canvasWidth, Parameters.spriteSize / canvasHeight];
        WebGPU.device.queue.writeBuffer(this.uniformsBuffer, 0, new Float32Array(uniformsData).buffer);
    }

    protected get pipeline(): Pipeline {
        if (Parameters.blending) {
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
