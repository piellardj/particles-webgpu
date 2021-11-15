/// <reference types="../webgpu-utils/wgsl-type" />

import ShaderSource from "../../shaders/draw-instanced.wgsl";
import * as WebGPU from "../webgpu-utils/webgpu-device";
import { RendererInstanced } from "./renderer-instanced";

type RenderableParticlesBatch = {
    gpuBuffer: GPUBuffer;
    particlesCount: number;
}

class RendererInstancedMonocolor extends RendererInstanced {
    public constructor(targetTextureFormat: GPUTextureFormat) {
        super(targetTextureFormat);

        const shaderModule = WebGPU.device.createShaderModule({ code: ShaderSource });

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
                            }
                        ],
                        arrayStride: Float32Array.BYTES_PER_ELEMENT * 4,
                        stepMode: "instance",
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
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
    RendererInstancedMonocolor,
};

