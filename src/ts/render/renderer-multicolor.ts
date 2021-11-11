/// <reference types="../webgpu-utils/wgsl-type" />

import ShaderSource from "../../shaders/draw-multicolor.wgsl";
import ColorShaderPartSource from "../../shaders/utils/color.part.wgsl";
import * as WebGPU from "../webgpu-utils/webgpu-device";
import { Renderer } from "./renderer";

type RenderableParticlesBatch = {
    gpuBuffer: GPUBuffer;
    colorsBuffer: GPUBuffer;
    particlesCount: number;
}

class RendererMulticolor extends Renderer {
    protected readonly pipeline: GPURenderPipeline;
    private readonly uniformsBindgroup: GPUBindGroup;

    public constructor(targetTextureFormat: GPUTextureFormat) {
        super(targetTextureFormat);

        const shaderModule = WebGPU.device.createShaderModule({ code: ColorShaderPartSource + ShaderSource });

        this.pipeline = WebGPU.device.createRenderPipeline({
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
                        stepMode: "vertex",
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: "uint32",
                            }
                        ],
                        arrayStride: Uint32Array.BYTES_PER_ELEMENT,
                        stepMode: "vertex",
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [this.colorTargetState],
            },
            primitive: {
                cullMode: "none",
                topology: "point-list",
            },
        });

        this.uniformsBindgroup = WebGPU.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformsBuffer,
                    }
                }
            ]
        });
    }

    public draw(canvasWidth: number, canvasHeight: number, renderPassEncoder: GPURenderPassEncoder, particlesBatch: RenderableParticlesBatch): void {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);

        renderPassEncoder.setPipeline(this.pipeline);
        renderPassEncoder.setBindGroup(0, this.uniformsBindgroup);
        renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
        renderPassEncoder.setVertexBuffer(1, particlesBatch.colorsBuffer);
        renderPassEncoder.draw(particlesBatch.particlesCount, 1, 0, 0);
    }
}

export {
    RendererMulticolor,
};

