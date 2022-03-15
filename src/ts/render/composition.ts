import ShaderSource from "../../shaders/composition.wgsl";
import { Parameters } from "../parameters";
import { WebGPUCanvas } from "../webgpu-utils/webgpu-canvas";
import * as WebGPU from "../webgpu-utils/webgpu-device";

class Composition {
    private readonly pipeline: GPURenderPipeline;

    private readonly uniformsBuffer: GPUBuffer;

    private texture: GPUTexture;
    private textureWidth: number = -1;
    private textureHeight: number = -1;
    private textureSampler: GPUSampler;
    private bindgroup: GPUBindGroup;
    public readonly textureFormat: GPUTextureFormat = "r8unorm";
    private renderToTexturePassDescriptor: GPURenderPassDescriptor;

    public constructor(targetTextureFormat: GPUTextureFormat) {
        const shaderModule = WebGPU.device.createShaderModule({ code: ShaderSource });

        this.pipeline = WebGPU.device.createRenderPipeline({
            vertex: {
                module: shaderModule,
                entryPoint: "main_vertex",
                buffers: []
            },
            fragment: {
                module: shaderModule,
                entryPoint: "main_fragment",
                targets: [{
                    format: targetTextureFormat,
                }],
            },
            primitive: {
                cullMode: "none",
                topology: "triangle-strip",
            },
        });
        
        this.uniformsBuffer = WebGPU.device.createBuffer({
            size: 20,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });

        this.textureSampler = WebGPU.device.createSampler({
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            magFilter: "linear",
            minFilter: "linear",
        });
    }

    public getRenderToTexturePassEncoder(commandEncoder: GPUCommandEncoder, webgpuCanvas: WebGPUCanvas): GPURenderPassEncoder {
        this.resizeTextureIfNeeded(webgpuCanvas.width, webgpuCanvas.height);

        return commandEncoder.beginRenderPass(this.renderToTexturePassDescriptor);
    }

    public apply(commandEncoder: GPUCommandEncoder, webgpuCanvas: WebGPUCanvas): void {
        const color = Parameters.particleColor;
        const uniformsData = new ArrayBuffer(20);
        new Float32Array(uniformsData, 0, 4).set([color[0], color[1], color[2], Parameters.opacity]);
        new Uint32Array(uniformsData, 16, 1).set([Parameters.blending ? 1 : 0]);
        WebGPU.device.queue.writeBuffer(this.uniformsBuffer, 0, uniformsData);

        const renderPassEncoder = webgpuCanvas.beginRenderPass(commandEncoder);
        renderPassEncoder.setPipeline(this.pipeline);
        renderPassEncoder.setBindGroup(0, this.bindgroup);
        renderPassEncoder.draw(4, 1, 0, 0);
        renderPassEncoder.end();
    }

    private resizeTextureIfNeeded(wantedWidth: number, wantedHeight: number): void {
        if (this.textureWidth !== wantedWidth || this.textureHeight !== wantedHeight) {
            if (this.texture) {
                this.texture.destroy();
            }

            this.texture = WebGPU.device.createTexture({
                size: [wantedWidth, wantedHeight],
                format: this.textureFormat,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            });
            this.textureWidth = wantedWidth;
            this.textureHeight = wantedHeight;

            this.bindgroup = WebGPU.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: this.uniformsBuffer,
                        }
                    },
                    {
                        binding: 1,
                        resource: this.texture.createView()
                    },
                    {
                        binding: 2,
                        resource: this.textureSampler
                    }
                ]
            });

            this.renderToTexturePassDescriptor = {
                colorAttachments: [{
                    view: this.texture.createView(),
                    loadOp: 'clear',
                    clearValue: {r: 0, g: 0, b: 0, a: 0},
                    storeOp: 'store'
                }],
            };
        }
    }
}

export {
    Composition,
};
