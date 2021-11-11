import { Parameters } from "../parameters";
import * as WebGPU from "../webgpu-utils/webgpu-device";

abstract class Renderer {
    protected readonly colorTargetState: GPUColorTargetState;
    protected readonly uniformsBuffer: GPUBuffer;

    protected constructor(targetTextureFormat: GPUTextureFormat) {
        this.colorTargetState = {
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

        this.uniformsBuffer = WebGPU.device.createBuffer({
            size: 24,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
        });
    }

    protected updateUniformsBuffer(canvasWidth: number, canvasHeight: number): void {
        const color = Parameters.particleColor;
        const uniformsData = [color[0], color[1], color[2], Parameters.opacity, Parameters.spriteSize / canvasWidth, Parameters.spriteSize / canvasHeight];
        WebGPU.device.queue.writeBuffer(this.uniformsBuffer, 0, new Float32Array(uniformsData).buffer);
    }
}

export {
    Renderer,
};
