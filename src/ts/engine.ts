/// <reference types="./page-interface-generated" />
/// <reference types="./webgpu-utils/wgsl-type" />

import InitializeColorsShaderSource from "../shaders/initialize-colors.wgsl";
import UpdateShaderSource from "../shaders/update.wgsl";
import ColorShaderPartSource from "../shaders/utils/color.part.wgsl";
import * as Attractors from "./attractors";
import { bytesToString } from "./helpers";
import { ColorMode, ColorSource, Parameters } from "./parameters";
import { IRenderer } from "./render/i-renderer";
import { RendererInstancedMonocolor } from "./render/renderer-instanced-monocolor";
import { RendererInstancedMonocolorHighQuality } from "./render/renderer-instanced-monocolor-high-quality";
import { RendererInstancedMulticolor } from "./render/renderer-instanced-multicolor";
import { RendererInstancedMulticolorVelocity } from "./render/renderer-instanced-multicolor-velocity";
import { RendererMonocolor } from "./render/renderer-monocolor";
import { RendererMonocolorHighQuality } from "./render/renderer-monocolor-high-quality";
import { RendererMulticolor } from "./render/renderer-multicolor";
import { RendererMulticolorVelocity } from "./render/renderer-multicolor-velocity";
import { WebGPUCanvas } from "./webgpu-utils/webgpu-canvas";
import * as WebGPU from "./webgpu-utils/webgpu-device";

const MAX_ATTRACTORS = 4;

type ParticlesBatch = {
    gpuBuffer: GPUBuffer;
    computeBindgroup: GPUBindGroup;
    colorsBuffer: GPUBuffer;
    initializeColorsComputeBindgroup: GPUBindGroup;
    particlesCount: number;
    dispatchSize: number;
}

class Engine {
    private static readonly WORKGROUP_SIZE = 256;

    private readonly computePipeline: GPUComputePipeline;
    private readonly computeUniformsBuffer: GPUBuffer;

    private readonly particleBatches: ParticlesBatch[] = [];

    private readonly initializeColorsComputePipeline: GPUComputePipeline;

    private readonly rendererMonocolor: RendererMonocolor;
    private readonly rendererMonocolorHighQuality: RendererMonocolorHighQuality;
    private readonly rendererMulticolor: RendererMulticolor;
    private readonly rendererMulticolorVelocity: RendererMulticolorVelocity;
    private readonly rendererInstancedMonocolor: RendererInstancedMonocolor;
    private readonly rendererInstancedMonocolorHighQuality: RendererInstancedMonocolorHighQuality;
    private readonly rendererInstancedMulticolor: RendererInstancedMulticolor;
    private readonly rendererInstancedMulticolorVelocity: RendererInstancedMulticolorVelocity;

    public constructor(targetTextureFormat: GPUTextureFormat) {
        this.rendererMonocolor = new RendererMonocolor(targetTextureFormat);
        this.rendererMonocolorHighQuality = new RendererMonocolorHighQuality(targetTextureFormat);
        this.rendererMulticolor = new RendererMulticolor(targetTextureFormat);
        this.rendererMulticolorVelocity = new RendererMulticolorVelocity(targetTextureFormat);
        this.rendererInstancedMonocolor = new RendererInstancedMonocolor(targetTextureFormat);
        this.rendererInstancedMonocolorHighQuality = new RendererInstancedMonocolorHighQuality(targetTextureFormat);
        this.rendererInstancedMulticolor = new RendererInstancedMulticolor(targetTextureFormat);
        this.rendererInstancedMulticolorVelocity = new RendererInstancedMulticolorVelocity(targetTextureFormat);

        this.computePipeline = WebGPU.device.createComputePipeline({
            compute: {
                module: WebGPU.device.createShaderModule({ code: UpdateShaderSource }),
                entryPoint: "main"
            },
            layout: "auto"
        });

        this.computeUniformsBuffer = WebGPU.device.createBuffer({
            size: 96,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });

        this.initializeColorsComputePipeline = WebGPU.device.createComputePipeline({
            compute: {
                module: WebGPU.device.createShaderModule({ code: ColorShaderPartSource + InitializeColorsShaderSource }),
                entryPoint: "main",
            },
            layout: "auto"
        });
    }

    public get particlesCount(): number {
        let count = 0;
        for (const particlesBatch of this.particleBatches) {
            count += particlesBatch.particlesCount;
        }
        return count;
    }

    public update(commandEncoder: GPUCommandEncoder, dt: number, aspectRatio: number): void {
        const attractors = Attractors.getPreset();
        if (Page.Canvas.isMouseDown()) {
            const attractor: Attractors.Attractor = {
                position: Page.Canvas.getMousePosition() as [number, number],
                force: 10 * Parameters.attraction,
            };
            attractor.position[0] = 2 * attractor.position[0] - 1;
            attractor.position[1] = 2 * attractor.position[1] - 1;
            attractors.push(attractor);
        }
        Attractors.setOverlays(attractors);

        const uniformForce: Attractors.Force = [0, 3 * Parameters.gravity];
        const uniformsBufferData = this.buildComputeUniforms(dt, aspectRatio, uniformForce, attractors);
        WebGPU.device.queue.writeBuffer(this.computeUniformsBuffer, 0, uniformsBufferData);

        for (const particlesBatch of this.particleBatches) {
            const computePass = commandEncoder.beginComputePass();
            computePass.setPipeline(this.computePipeline);
            computePass.setBindGroup(0, particlesBatch.computeBindgroup);
            computePass.dispatchWorkgroups(particlesBatch.dispatchSize);
            computePass.end();
        }
    }

    public draw(commandEncoder: GPUCommandEncoder, webgpuCanvas: WebGPUCanvas): void {
        let renderer: IRenderer;
        const instanced = (Parameters.spriteSize > 1);
        if (Parameters.colorMode === ColorMode.UNICOLOR) {
            if (Parameters.highColorQuality) {
                if (instanced) {
                    renderer = this.rendererInstancedMonocolorHighQuality;
                } else {
                    renderer = this.rendererMonocolorHighQuality;
                }
            } else {
                if (instanced) {
                    renderer = this.rendererInstancedMonocolor;
                } else {
                    renderer = this.rendererMonocolor;
                }
            }
        } else if (Parameters.colorSource === ColorSource.IMAGE) {
            if (instanced) {
                renderer = this.rendererInstancedMulticolor;
            } else {
                renderer = this.rendererMulticolor;
            }
        } else {
            if (instanced) {
                renderer = this.rendererInstancedMulticolorVelocity;
            } else {
                renderer = this.rendererMulticolorVelocity;
            }
        }

        renderer.particleColor = Parameters.particleColor;
        renderer.particleOpacity = Parameters.opacity;
        renderer.enableAdditiveBlending = Parameters.blending;
        renderer.spriteSize = Parameters.spriteSize;
        renderer.draw(commandEncoder, webgpuCanvas, this.particleBatches);
    }

    public reset(wantedParticlesCount: number): void {
        for (const particlesBatch of this.particleBatches) {
            if (particlesBatch.gpuBuffer) {
                particlesBatch.gpuBuffer.destroy();
            }
            if (particlesBatch.colorsBuffer) {
                particlesBatch.colorsBuffer.destroy();
            }
        }
        this.particleBatches.length = 0;

        let totalGpuBufferSize = 0, totalColorBufferSize = 0;

        const particleSize = Float32Array.BYTES_PER_ELEMENT * (2 + 2);
        const maxDispatchSize = Math.floor(WebGPU.device.limits.maxStorageBufferBindingSize / particleSize / Engine.WORKGROUP_SIZE);

        let particlesLeftToAllocate = wantedParticlesCount;
        while (particlesLeftToAllocate > 0) {
            const idealDispatchSize = Math.ceil(particlesLeftToAllocate / Engine.WORKGROUP_SIZE);

            const dispatchSize = Math.min(idealDispatchSize, maxDispatchSize);
            const particlesCount = dispatchSize * Engine.WORKGROUP_SIZE;
            particlesLeftToAllocate -= particlesCount;

            const gpuBufferSize = particlesCount * particleSize;
            const gpuBuffer = WebGPU.device.createBuffer({
                size: gpuBufferSize,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
                mappedAtCreation: true,
            });
            totalGpuBufferSize += gpuBufferSize;
            const colorsBufferSize = particlesCount * Uint32Array.BYTES_PER_ELEMENT;
            const colorsGpuBuffer = WebGPU.device.createBuffer({
                size: colorsBufferSize,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
                mappedAtCreation: false,
            });
            totalColorBufferSize += colorsBufferSize;

            const gpuBufferData = gpuBuffer.getMappedRange();
            const particlesBuffer = new Float32Array(gpuBufferData);
            for (let iParticle = 0; iParticle < particlesCount; iParticle++) {
                particlesBuffer[4 * iParticle + 0] = Math.random() * 2 - 1;
                particlesBuffer[4 * iParticle + 1] = Math.random() * 2 - 1;
                particlesBuffer[4 * iParticle + 2] = 0;
                particlesBuffer[4 * iParticle + 3] = 0;
            }
            gpuBuffer.unmap();

            const computeBindgroup = WebGPU.device.createBindGroup({
                layout: this.computePipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: gpuBuffer
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: this.computeUniformsBuffer
                        }
                    }
                ]
            });

            const initializeColorsComputeBindgroup = WebGPU.device.createBindGroup({
                layout: this.initializeColorsComputePipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: gpuBuffer
                        }
                    },
                    {
                        binding: 1,
                        resource: {
                            buffer: colorsGpuBuffer
                        }
                    }
                ]
            });

            this.particleBatches.push({
                gpuBuffer,
                computeBindgroup,
                colorsBuffer: colorsGpuBuffer,
                initializeColorsComputeBindgroup,
                particlesCount,
                dispatchSize,
            });
        }

        console.info(`GPU memory used:\n  - positions/velocities: ${bytesToString(totalGpuBufferSize)}\n  - colors: ${bytesToString(totalColorBufferSize)}`);
    }

    public initializeColors(commandEncoder: GPUCommandEncoder, sampler: GPUSampler, texture: GPUTexture): void {
        const textureBindgroup = WebGPU.device.createBindGroup({
            layout: this.initializeColorsComputePipeline.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: sampler
                },
                {
                    binding: 1,
                    resource: texture.createView()
                }
            ]
        });

        for (const particlesBatch of this.particleBatches) {
            const computePass = commandEncoder.beginComputePass();
            computePass.setPipeline(this.initializeColorsComputePipeline);
            computePass.setBindGroup(0, particlesBatch.initializeColorsComputeBindgroup);
            computePass.setBindGroup(1, textureBindgroup);
            computePass.dispatchWorkgroups(particlesBatch.dispatchSize);
            computePass.end();
        }
    }

    private buildComputeUniforms(dt: number, aspectRatio: number, force: Attractors.Force, attractors: Attractors.Attractor[]): ArrayBuffer {
        if (attractors.length > MAX_ATTRACTORS) {
            throw new Error(`Too many attractors (${attractors.length}, max is ${MAX_ATTRACTORS}).`);
        }

        const buffer = new ArrayBuffer(96);

        new Float32Array(buffer, 0, 2).set([force[0], force[1]]);
        new Float32Array(buffer, 8, 1).set([dt]);
        new Uint32Array(buffer, 12, 1).set([Parameters.bounce ? 1 : 0]);
        new Float32Array(buffer, 16, 1).set([Parameters.friction]);
        new Float32Array(buffer, 20, 1).set([aspectRatio]);
        new Uint32Array(buffer, 24, 1).set([attractors.length]);

        const attractorsData = [];
        for (const attractor of attractors) {
            attractorsData.push(attractor.position[0]);
            attractorsData.push(attractor.position[1]);
            attractorsData.push(attractor.force);
            attractorsData.push(0); // padding
        }
        new Float32Array(buffer, 32, attractorsData.length).set(attractorsData);

        return buffer;
    }
}

export {
    Engine,
};

