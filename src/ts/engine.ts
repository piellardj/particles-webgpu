import DrawShaderSource from "../shaders/draw.wgsl";
import * as WebGPU from "./webgpu-utils/webgpu-device";

class Engine {
    private readonly renderPipeline: GPURenderPipeline;

    private static readonly particleSize: number = Float32Array.BYTES_PER_ELEMENT * 2;
    private gpuBuffer: GPUBuffer | null = null;
    private particlesCount: number = 0;

    public constructor(targetTextureFormat: GPUTextureFormat) {
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
                        arrayStride: Engine.particleSize,
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
    }

    public draw(renderPassEncoder: GPURenderPassEncoder): void {
        renderPassEncoder.setPipeline(this.renderPipeline);
        renderPassEncoder.setVertexBuffer(0, this.gpuBuffer);
        renderPassEncoder.draw(this.particlesCount, this.particlesCount, 0, 0);
    }

    public reset(particlesCount: number): void {
        const nbRows = Math.ceil(Math.sqrt(particlesCount));
        const nbColumns = nbRows;
        this.particlesCount = nbRows * nbColumns;

        const bufferData = new Float32Array(this.particlesCount * 2);
        {
            let i = 0;
            for (let iY = 0; iY < nbRows; iY++) {
                for (let iX = 0; iX < nbColumns; iX++) {
                    bufferData[i++] = iX / (nbColumns - 1) * 2 - 1;
                    bufferData[i++] = iY / (nbRows - 1) * 2 - 1;
                }
            }
        }

        if (this.gpuBuffer) {
            this.gpuBuffer.destroy();
        }
        this.gpuBuffer = WebGPU.device.createBuffer({
            size: bufferData.byteLength,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(this.gpuBuffer.getMappedRange()).set(bufferData);
        this.gpuBuffer.unmap();
    }
}

export {
    Engine,
};

