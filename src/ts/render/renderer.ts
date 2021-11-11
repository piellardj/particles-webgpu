import { Parameters } from "../parameters";
import * as WebGPU from "../webgpu-utils/webgpu-device";

type Pipeline = {
    renderPipeline: GPURenderPipeline;
    uniformsBindgroup: GPUBindGroup;
}

abstract class Renderer {
    private readonly uniformsBuffer: GPUBuffer;

    protected pipeline: Pipeline;

    protected constructor(private readonly targetTextureFormat: GPUTextureFormat) {
        this.uniformsBuffer = WebGPU.device.createBuffer({
            size: 24,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });
    }

    protected createRenderPipelines(descriptor: GPURenderPipelineDescriptor): void {
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
        this.pipeline = this.createPipeline(descriptor);
    }

    protected updateUniformsBuffer(canvasWidth: number, canvasHeight: number): void {
        const color = Parameters.particleColor;
        const uniformsData = [color[0], color[1], color[2], Parameters.opacity, Parameters.spriteSize / canvasWidth, Parameters.spriteSize / canvasHeight];
        WebGPU.device.queue.writeBuffer(this.uniformsBuffer, 0, new Float32Array(uniformsData).buffer);
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
