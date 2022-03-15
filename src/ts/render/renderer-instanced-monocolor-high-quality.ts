/// <reference types="../webgpu-utils/wgsl-type" />

import { RendererHighQuality } from "./renderer-high-quality";
import { RendererInstancedMonocolor } from "./renderer-instanced-monocolor";

class RendererInstancedMonocolorHighQuality extends RendererHighQuality {
    protected readonly renderer: RendererInstancedMonocolor;

    public constructor(targetTextureFormat: GPUTextureFormat) {
        super(targetTextureFormat);
        this.renderer = new RendererInstancedMonocolor(this.composition.textureFormat);
    }
}

export {
    RendererInstancedMonocolorHighQuality,
};

