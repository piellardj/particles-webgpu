/// <reference types="../webgpu-utils/wgsl-type" />

import ShaderSource from "../../shaders/draw-monocolor.wgsl";
import * as WebGPU from "../webgpu-utils/webgpu-device";
import { Renderer } from "./renderer";

type RenderableParticlesBatch = {
    gpuBuffer: GPUBuffer;
    particlesCount: number;
}

class RendererMonocolor extends Renderer {
    public constructor(targetTextureFormat: GPUTextureFormat) {
        super(targetTextureFormat);

        const shaderModule = WebGPU.device!.createShaderModule({ code: ShaderSource });

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
                topology: "point-list",
            },
            layout: "auto"
        });
    }

    public override drawInternal(renderPassEncoder: GPURenderPassEncoder, canvasWidth: number, canvasHeight: number, particleBatches: RenderableParticlesBatch[]): void {
        super.updateUniformsBuffer(canvasWidth, canvasHeight);

        renderPassEncoder.setPipeline(this.pipeline.renderPipeline);
        renderPassEncoder.setBindGroup(0, this.pipeline.uniformsBindgroup);
        for (const particlesBatch of particleBatches) {
            renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
            renderPassEncoder.draw(particlesBatch.particlesCount, 1, 0, 0);
        }
    }
}

export {
    RendererMonocolor,
};

