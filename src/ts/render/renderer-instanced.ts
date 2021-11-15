/// <reference types="../webgpu-utils/wgsl-type" />

import * as WebGPU from "../webgpu-utils/webgpu-device";
import { Renderer } from "./renderer";

abstract class RendererInstanced extends Renderer {
    protected readonly quadBuffer: GPUBuffer;

    public constructor(targetTextureFormat: GPUTextureFormat) {
        super(targetTextureFormat);

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
    }
}

export {
    RendererInstanced,
};

