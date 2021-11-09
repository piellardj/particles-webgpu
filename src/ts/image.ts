import * as WebGPU from "./webgpu-utils/webgpu-device";

type Texture = {
    path: string;
    gpuTexture: GPUTexture;
}

let linearSampler: GPUSampler;
let texture: Texture;

async function getTexture(path: string): Promise<GPUTexture> {
    if (!texture || texture.path !== path) {
        if (texture) {
            texture.gpuTexture.destroy();
        }

        const image = document.createElement("img");
        image.src = path;
        await image.decode();
        const imageBitmap = await createImageBitmap(image);

        const gpuTexture = WebGPU.device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT
        });
        WebGPU.device.queue.copyExternalImageToTexture(
            { source: imageBitmap },
            { texture: gpuTexture },
            [imageBitmap.width, imageBitmap.height]
        );

        texture = {
            path,
            gpuTexture
        };
    }

    return texture.gpuTexture;
}

function getSampler(): GPUSampler {
    if (!linearSampler) {
        linearSampler = WebGPU.device.createSampler({
            addressModeU: "clamp-to-edge",
            addressModeV: "clamp-to-edge",
            magFilter: "linear",
            minFilter: "linear",
        });
    }
    return linearSampler;
}

export {
    getSampler,
    getTexture,
};
