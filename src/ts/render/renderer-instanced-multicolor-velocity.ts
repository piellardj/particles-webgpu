/// <reference types="../webgpu-utils/wgsl-type" />

import { Renderer } from "./renderer";
import * as WebGPU from "../webgpu-utils/webgpu-device";
import ShaderSource from "../../shaders/draw-instanced-multicolor-velocity.wgsl";
import ColorShaderPartSource from "../../shaders/utils/color.part.wgsl";

type RenderableParticlesBatch = {
    gpuBuffer: GPUBuffer;
    particlesCount: number;
}

class RendererInstancedMulticolorVelocity extends Renderer {
    private readonly quadBuffer: GPUBuffer;

    public constructor(targetTextureFormat: GPUTextureFormat) {
        super(targetTextureFormat);

        this.quadBuffer = WebGPU.device.createBuffer({
            size: Float32Array.BYTES_PER_ELEMENT * 2 * 6,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(this.quadBuffer.getMappedRange()).set([
            -1, -1, +1, -1, +1, +1,
            -1, -1, +1, +1, -1, +1
        ]);
        this.quadBuffer.unmap();

        const shaderModule = WebGPU.device.createShaderModule({ code: ColorShaderPartSource + ShaderSource });

        this.createRenderPipelines({
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
                buffers: [
                    {
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2",
                            },
                            {
                                shaderLocation: 1,
                                offset: Float32Array.BYTES_PER_ELEMENT * 2,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
                        stepMode: "instance",
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 2,
                                offset: 0,
                                format: "float32x2",
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
                        stepMode: "vertex",
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-list",
            },
        });
    }

    public override draw(canvasWidth: number, canvasHeight: number, renderPassEncoder: GPURenderPassEncoder, particlesBatch: RenderableParticlesBatch): void {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);

        const pipeline = this.pipeline;
        renderPassEncoder.setPipeline(pipeline.renderPipeline);
        renderPassEncoder.setBindGroup(0, pipeline.uniformsBindgroup);
        renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
        renderPassEncoder.setVertexBuffer(1, this.quadBuffer);
        renderPassEncoder.draw(6, particlesBatch.particlesCount, 0, 0);
    }
}

export {
    RendererInstancedMulticolorVelocity,
};
