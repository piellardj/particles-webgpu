/// <reference types="../webgpu-utils/wgsl-type" />

import ShaderSource from "../../shaders/draw-instanced-multicolor-velocity.wgsl";
import ColorShaderPartSource from "../../shaders/utils/color.part.wgsl";
import * as WebGPU from "../webgpu-utils/webgpu-device";
import { RendererInstanced } from "./renderer-instanced";

type RenderableParticlesBatch = {
    gpuBuffer: GPUBuffer;
    particlesCount: number;
}

class RendererInstancedMulticolorVelocity extends RendererInstanced {
    public constructor(targetTextureFormat: GPUTextureFormat) {
        super(targetTextureFormat);

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
            layout: "auto"
        });
    }

    public override drawInternal(renderPassEncoder: GPURenderPassEncoder, canvasWidth: number, canvasHeight: number, particleBatches: RenderableParticlesBatch[]): void {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);

        renderPassEncoder.setPipeline(this.pipeline.renderPipeline);
        renderPassEncoder.setBindGroup(0, this.pipeline.uniformsBindgroup);
        renderPassEncoder.setVertexBuffer(1, this.quadBuffer);
        for (const particlesBatch of particleBatches) {
            renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
            renderPassEncoder.draw(6, particlesBatch.particlesCount, 0, 0);
        }
    }
}

export {
    RendererInstancedMulticolorVelocity,
};
