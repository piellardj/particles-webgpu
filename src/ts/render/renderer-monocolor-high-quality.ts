/// <reference types="../webgpu-utils/wgsl-type" />

import { RendererHighQuality } from "./renderer-high-quality";
import { RendererMonocolor } from "./renderer-monocolor";

class RendererMonocolorHighQuality extends RendererHighQuality {
    protected readonly renderer: RendererMonocolor;

    public constructor(targetTextureFormat: GPUTextureFormat) {
        super(targetTextureFormat);
        this.renderer = new RendererMonocolor(this.composition.textureFormat);
    }
}

export {
    RendererMonocolorHighQuality,
};

