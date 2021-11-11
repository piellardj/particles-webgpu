import DrawMulticolorInstancedShaderSource from "../shaders/draw-instanced-multicolor.wgsl";
import DrawInstancedShaderSource from "../shaders/draw-instanced.wgsl";
import DrawMulticolorShaderSource from "../shaders/draw-multicolor.wgsl";
import DrawShaderSource from "../shaders/draw.wgsl";
import InitializeColorsShaderSource from "../shaders/initialize-colors.wgsl";
import UpdateShaderSource from "../shaders/update.wgsl";
import ColorShaderPartSource from "../shaders/utils/color.part.wgsl";
import { Attractor, Force, setOverlays } from "./attractors";
import { bytesToString } from "./helpers";
import { ColorMode, Parameters } from "./parameters";
import * as WebGPU from "./webgpu-utils/webgpu-device";

const MAX_ATTRACTORS = 1;

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

    private readonly quadBuffer: GPUBuffer;

    private readonly computePipeline: GPUComputePipeline;
    private readonly renderPipeline: GPURenderPipeline;
    private readonly renderMulticolorPipeline: GPURenderPipeline;
    private readonly renderPipelineInstanced: GPURenderPipeline;
    private readonly renderMulticolorPipelineInstanced: GPURenderPipeline;

    private readonly computeUniformsBuffer: GPUBuffer;
    private readonly renderUniformsBuffer: GPUBuffer;

    private readonly particleBatches: ParticlesBatch[] = [];

    private readonly renderBindgroup: GPUBindGroup;
    private readonly renderMulticolorBindgroup: GPUBindGroup;
    private readonly renderBindgroupInstanced: GPUBindGroup;
    private readonly renderMulticolorBindgroupInstanced: GPUBindGroup;

    private readonly initializeColorsComputePipeline: GPUComputePipeline;

    public constructor(targetTextureFormat: GPUTextureFormat) {
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

        this.computePipeline = WebGPU.device.createComputePipeline({
            compute: {
                module: WebGPU.device.createShaderModule({ code: UpdateShaderSource }),
                entryPoint: "main"
            }
        });

        const colorTargetState: GPUColorTargetState = {
            format: targetTextureFormat,
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
        };

        this.renderPipeline = WebGPU.device.createRenderPipeline({
            vertex: {
                module: WebGPU.device.createShaderModule({ code: DrawShaderSource }),
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
                module: WebGPU.device.createShaderModule({ code: DrawShaderSource }),
                entryPoint: "main_fragment",
                targets: [colorTargetState],
            },
            primitive: {
                cullMode: "none",
                topology: "point-list",
            },
        });

        this.renderMulticolorPipeline = WebGPU.device.createRenderPipeline({
            vertex: {
                module: WebGPU.device.createShaderModule({ code: ColorShaderPartSource + DrawMulticolorShaderSource }),
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
                module: WebGPU.device.createShaderModule({ code: ColorShaderPartSource + DrawMulticolorShaderSource }),
                entryPoint: "main_fragment",
                targets: [colorTargetState],
            },
            primitive: {
                cullMode: "none",
                topology: "point-list",
            },
        });

        this.renderPipelineInstanced = WebGPU.device.createRenderPipeline({
            vertex: {
                module: WebGPU.device.createShaderModule({ code: DrawInstancedShaderSource }),
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
                module: WebGPU.device.createShaderModule({ code: DrawInstancedShaderSource }),
                entryPoint: "main_fragment",
                targets: [colorTargetState],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-list",
            },
        });

        this.renderMulticolorPipelineInstanced = WebGPU.device.createRenderPipeline({
            vertex: {
                module: WebGPU.device.createShaderModule({ code: ColorShaderPartSource + DrawMulticolorInstancedShaderSource }),
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
                    },
                    {
                        attributes: [
                            {
                                shaderLocation: 2,
                                offset: 0,
                                format: "uint32",
                            }
                        ],
                        arrayStride: Uint32Array.BYTES_PER_ELEMENT,
                        stepMode: "instance",
                    }
                ]
            },
            fragment: {
                module: WebGPU.device.createShaderModule({ code: ColorShaderPartSource + DrawMulticolorInstancedShaderSource }),
                entryPoint: "main_fragment",
                targets: [colorTargetState],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-list",
            },
        });

        this.computeUniformsBuffer = WebGPU.device.createBuffer({
            size: 48,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });

        this.renderUniformsBuffer = WebGPU.device.createBuffer({
            size: 24,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });
        this.renderBindgroup = WebGPU.device.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.renderUniformsBuffer,
                    }
                }
            ]
        });
        this.renderMulticolorBindgroup = WebGPU.device.createBindGroup({
            layout: this.renderMulticolorPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.renderUniformsBuffer,
                    }
                }
            ]
        });
        this.renderBindgroupInstanced = WebGPU.device.createBindGroup({
            layout: this.renderPipelineInstanced.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.renderUniformsBuffer,
                    }
                }
            ]
        });
        this.renderMulticolorBindgroupInstanced = WebGPU.device.createBindGroup({
            layout: this.renderMulticolorPipelineInstanced.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.renderUniformsBuffer,
                    }
                }
            ]
        });

        this.initializeColorsComputePipeline = WebGPU.device.createComputePipeline({
            compute: {
                module: WebGPU.device.createShaderModule({ code: ColorShaderPartSource + InitializeColorsShaderSource }),
                entryPoint: "main"
            }
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
        const attractor: Attractor = {
            position: Page.Canvas.getMousePosition() as [number, number],
            force: Page.Canvas.isMouseDown() ? 6 * Parameters.attraction : 0,
        };
        attractor.position[0] = 2 * attractor.position[0] - 1;
        attractor.position[1] = 2 * attractor.position[1] - 1;
        setOverlays(attractors);

        const uniformForce: Force = [0, 3 * Parameters.gravity];
        WebGPU.device.queue.writeBuffer(this.computeUniformsBuffer, 0, uniformsBufferData);

        for (const particlesBatch of this.particleBatches) {
            const computePass = commandEncoder.beginComputePass();
            computePass.setPipeline(this.computePipeline);
            computePass.setBindGroup(0, particlesBatch.computeBindgroup);
            computePass.dispatch(particlesBatch.dispatchSize);
            computePass.endPass();
        }
    }

    public draw(canvasWidth: number, canvasHeight: number, renderPassEncoder: GPURenderPassEncoder): void {
        const color = Parameters.particleColor;
        const uniformsData = [color[0], color[1], color[2], Parameters.opacity, Parameters.spriteSize / canvasWidth, Parameters.spriteSize / canvasHeight];
        WebGPU.device.queue.writeBuffer(this.renderUniformsBuffer, 0, new Float32Array(uniformsData).buffer);

        let draw: (particlesBatch: ParticlesBatch) => void;
        if (Parameters.colorMode === ColorMode.UNICOLOR) {
            if (Parameters.spriteSize > 1) {
                draw = (particlesBatch: ParticlesBatch) => {
                    renderPassEncoder.setPipeline(this.renderPipelineInstanced);
                    renderPassEncoder.setBindGroup(0, this.renderBindgroupInstanced);
                    renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
                    renderPassEncoder.setVertexBuffer(1, this.quadBuffer);
                    renderPassEncoder.draw(6, particlesBatch.particlesCount, 0, 0);
                };
            } else {
                draw = (particlesBatch: ParticlesBatch) => {
                    renderPassEncoder.setPipeline(this.renderPipeline);
                    renderPassEncoder.setBindGroup(0, this.renderBindgroup);
                    renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
                    renderPassEncoder.draw(particlesBatch.particlesCount, 1, 0, 0);
                };
            }
        } else {
            if (Parameters.spriteSize > 1) {
                draw = (particlesBatch: ParticlesBatch) => {
                    renderPassEncoder.setPipeline(this.renderMulticolorPipelineInstanced);
                    renderPassEncoder.setBindGroup(0, this.renderMulticolorBindgroupInstanced);
                    renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
                    renderPassEncoder.setVertexBuffer(1, this.quadBuffer);
                    renderPassEncoder.setVertexBuffer(2, particlesBatch.colorsBuffer);
                    renderPassEncoder.draw(6, particlesBatch.particlesCount, 0, 0);
                };
            } else {
                draw = (particlesBatch: ParticlesBatch) => {
                    renderPassEncoder.setPipeline(this.renderMulticolorPipeline);
                    renderPassEncoder.setBindGroup(0, this.renderMulticolorBindgroup || this.renderBindgroup);
                    renderPassEncoder.setVertexBuffer(0, particlesBatch.gpuBuffer);
                    renderPassEncoder.setVertexBuffer(1, particlesBatch.colorsBuffer);
                    renderPassEncoder.draw(particlesBatch.particlesCount, 1, 0, 0);
                };
            }
        }

        for (const particlesBatch of this.particleBatches) {
            draw(particlesBatch);
        }
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
            computePass.dispatch(particlesBatch.dispatchSize);
            computePass.endPass();
        }
    }

    private buildComputeUniforms(dt: number, aspectRatio: number, force: Force, attractors: Attractor[]): ArrayBuffer {
        if (attractors.length > MAX_ATTRACTORS) {
            throw new Error(`Too many attractors (${attractors.length}, max is ${MAX_ATTRACTORS}).`);
        }

        const buffer = new ArrayBuffer(48);

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

