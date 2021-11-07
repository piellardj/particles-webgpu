import DrawShaderSource from "../shaders/draw.wgsl";
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

    private readonly computePipeline: GPUComputePipeline;
    private readonly renderPipeline: GPURenderPipeline;

    private readonly uniformsBuffer: GPUBuffer;
    private gpuBuffer: GPUBuffer;
    private usefulParticlesCount: number = 0;

    private computeBindgroup: GPUBindGroup;

    public constructor(targetTextureFormat: GPUTextureFormat) {
        this.computePipeline = WebGPU.device.createComputePipeline({
            compute: {
                module: WebGPU.device.createShaderModule({ code: UpdateShaderSource }),
                entryPoint: "main"
            }
        });

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
                targets: [{
                    format: targetTextureFormat,
                }],
            },
            primitive: {
                cullMode: "none",
                topology: "point-list",
            },
        });

        this.uniformsBuffer = WebGPU.device.createBuffer({
            size: 48,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });
    }

    public get particlesCount(): number {
        return this.usefulParticlesCount;
    }

    public update(commandEncoder: GPUCommandEncoder, dt: number): void {
        const attractor: Attractor = {
            position: Page.Canvas.getMousePosition() as [number, number],
            force: Page.Canvas.isMouseDown() ? 0.3 : 0,
        };
        attractor.position[0] = 2 * attractor.position[0] - 1;
        attractor.position[1] = 2 * attractor.position[1] - 1;
        const uniformForce: Force = [0, 3 * Parameters.gravity];
        const uniformsBufferData = this.buildComputeUniforms(dt, uniformForce, [attractor]);
        WebGPU.device.queue.writeBuffer(this.uniformsBuffer, 0, uniformsBufferData);

        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.computeBindgroup);
        computePass.dispatch(this.dispatchSize);
        computePass.endPass();
    }

    public draw(renderPassEncoder: GPURenderPassEncoder): void {
        renderPassEncoder.setPipeline(this.renderPipeline);
        renderPassEncoder.setVertexBuffer(0, this.gpuBuffer);
        renderPassEncoder.draw(this.usefulParticlesCount, this.usefulParticlesCount, 0, 0);
    }

    public reset(particlesCount: number): void {
        const nbRows = Math.ceil(Math.sqrt(particlesCount));
        const nbColumns = nbRows;
        this.usefulParticlesCount = nbRows * nbColumns;
        this.dispatchSize = Math.ceil(this.usefulParticlesCount / Engine.WORKGROUP_SIZE);

        // round particles count so that

        {
            if (this.gpuBuffer) {
                this.gpuBuffer.destroy();
            }
            const roundedParticlesCount = this.dispatchSize * Engine.WORKGROUP_SIZE;
            this.gpuBuffer = WebGPU.device.createBuffer({
                size: Float32Array.BYTES_PER_ELEMENT * (roundedParticlesCount * (2 + 2)),
                usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
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
                        buffer: this.uniformsBuffer
                    }
                }
            ]
        });
    }

    private buildComputeUniforms(dt: number, force: Force, attractors: Attractor[]): ArrayBuffer {
        if (attractors.length > MAX_ATTRACTORS) {
            throw new Error(`Too many attractors (${attractors.length}, max is ${MAX_ATTRACTORS}).`);
        }

        const buffer = new ArrayBuffer(48);

        new Float32Array(buffer, 0, 2).set([force[0], force[1]]);
        new Float32Array(buffer, 8, 1).set([dt]);
        new Uint32Array(buffer, 12, 1).set([Parameters.bounce ? 1 : 0]);
        new Float32Array(buffer, 16, 1).set([Parameters.friction]);
        new Uint32Array(buffer, 20, 1).set([1]); // attractors count

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

