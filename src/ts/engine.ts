import DrawShaderSource from "../shaders/draw.wgsl";
import DrawInstancedShaderSource from "../shaders/draw-instanced.wgsl";
import UpdateShaderSource from "../shaders/update.wgsl";
import { Parameters } from "./parameters";
import * as WebGPU from "./webgpu-utils/webgpu-device";

type Force = [number, number];
type Attractor = {
    position: [number, number];
    force: number;
}
const MAX_ATTRACTORS = 1;

class Engine {
    private static readonly WORKGROUP_SIZE = 64;
    private dispatchSize: number;

    private readonly quadBuffer: GPUBuffer;

    private readonly computePipeline: GPUComputePipeline;
    private readonly renderPipeline: GPURenderPipeline;
    private readonly renderPipelineInstanced: GPURenderPipeline;

    private readonly computeUniformsBuffer: GPUBuffer;
    private readonly renderUniformsBuffer: GPUBuffer;

    private gpuBuffer: GPUBuffer;
    private usefulParticlesCount: number = 0;

    private computeBindgroup: GPUBindGroup;
    private readonly renderBindgroup: GPUBindGroup;
    private readonly renderBindgroupInstanced: GPUBindGroup;

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

        const renderVertexState: GPUVertexState = {
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
        };
        const renderInstancedVertexState: GPUVertexState = {
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
        };

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
            vertex: renderVertexState,
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

        this.renderPipelineInstanced = WebGPU.device.createRenderPipeline({
            vertex: renderInstancedVertexState,
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
    }

    public get particlesCount(): number {
        return this.usefulParticlesCount;
    }

    public update(commandEncoder: GPUCommandEncoder, dt: number, aspectRatio: number): void {
        const attractor: Attractor = {
            position: Page.Canvas.getMousePosition() as [number, number],
            force: Page.Canvas.isMouseDown() ? 6 * Parameters.attraction : 0,
        };
        attractor.position[0] = 2 * attractor.position[0] - 1;
        attractor.position[1] = 2 * attractor.position[1] - 1;
        const uniformForce: Force = [0, 3 * Parameters.gravity];
        const uniformsBufferData = this.buildComputeUniforms(dt, aspectRatio, uniformForce, [attractor]);
        WebGPU.device.queue.writeBuffer(this.computeUniformsBuffer, 0, uniformsBufferData);

        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.computeBindgroup);
        computePass.dispatch(this.dispatchSize);
        computePass.endPass();
    }

    public draw(canvasWidth: number, canvasHeight: number, renderPassEncoder: GPURenderPassEncoder): void {
        const color = Parameters.particleColor;
        const uniformsData = [color[0], color[1], color[2], Parameters.opacity, Parameters.spriteSize / canvasWidth, Parameters.spriteSize / canvasHeight];
        WebGPU.device.queue.writeBuffer(this.renderUniformsBuffer, 0, new Float32Array(uniformsData).buffer);

        if (Parameters.spriteSize > 1) {
            renderPassEncoder.setPipeline(this.renderPipelineInstanced);
            renderPassEncoder.setBindGroup(0, this.renderBindgroupInstanced);
            renderPassEncoder.setVertexBuffer(0, this.gpuBuffer);
            renderPassEncoder.setVertexBuffer(1, this.quadBuffer);
            renderPassEncoder.draw(6, this.usefulParticlesCount, 0, 0);
        } else {
            renderPassEncoder.setPipeline(this.renderPipeline);
            renderPassEncoder.setBindGroup(0, this.renderBindgroup);
            renderPassEncoder.setVertexBuffer(0, this.gpuBuffer);
            renderPassEncoder.draw(this.usefulParticlesCount, 1, 0, 0);
        }
    }

    public reset(particlesCount: number): void {
        const nbRows = Math.ceil(Math.sqrt(particlesCount));
        const nbColumns = nbRows;
        this.usefulParticlesCount = nbRows * nbColumns;
        this.dispatchSize = Math.ceil(this.usefulParticlesCount / Engine.WORKGROUP_SIZE);

        {
            if (this.gpuBuffer) {
                this.gpuBuffer.destroy();
            }
            const roundedParticlesCount = this.dispatchSize * Engine.WORKGROUP_SIZE;
            this.gpuBuffer = WebGPU.device.createBuffer({
                size: Float32Array.BYTES_PER_ELEMENT * (roundedParticlesCount * (2 + 2)),
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
                mappedAtCreation: true,
            });

            const gpuBufferData = this.gpuBuffer.getMappedRange();
            const particlesBuffer = new Float32Array(gpuBufferData);
            let i = 0;
            for (let iY = 0; iY < nbRows; iY++) {
                for (let iX = 0; iX < nbColumns; iX++) {
                    particlesBuffer[i++] = iX / (nbColumns - 1) * 2 - 1;
                    particlesBuffer[i++] = iY / (nbRows - 1) * 2 - 1;
                    particlesBuffer[i++] = 0;
                    particlesBuffer[i++] = 0;
                }
            }

            this.gpuBuffer.unmap();
        }

        this.computeBindgroup = WebGPU.device.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.gpuBuffer
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
        new Uint32Array(buffer, 24, 1).set([1]); // attractors count

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

