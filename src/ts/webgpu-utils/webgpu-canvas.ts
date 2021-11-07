import * as WebGPU from "./webgpu-device";

class WebGPUCanvas {
    private readonly devicePixelRatio: number;
    private readonly context: GPUCanvasContext;
    private readonly canvasConfiguration: GPUCanvasConfiguration;

    public readonly textureFormat: GPUTextureFormat;
    public readonly clearColor: GPUColorDict;

    public constructor(private readonly canvas: HTMLCanvasElement) {
        this.devicePixelRatio = window.devicePixelRatio;

        const contextName = "webgpu";
        this.context = canvas.getContext(contextName);
        if (!this.context) {
            throw new Error(`Failed to get a '${contextName}' context from canvas.`);
        }

        this.canvasConfiguration = {
            device: WebGPU.device,
            format: this.context.getPreferredFormat(WebGPU.adapter),
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            // no "size" attribute to use the canvas' width and height
        };
        this.context.configure(this.canvasConfiguration);

        this.textureFormat = this.canvasConfiguration.format;
        this.clearColor = { r: 0, g: 0, b: 0, a: 1 };
    }

    public get width(): number {
        return this.canvas.width;
    }

    public get height(): number {
        return this.canvas.height;
    }

    public adjustSize(): void {
        const actualWidth = Math.floor(this.devicePixelRatio * this.canvas.clientWidth);
        const actualHeight = Math.floor(this.devicePixelRatio * this.canvas.clientHeight);

        if (this.canvas.width !== actualWidth || this.canvas.height !== actualHeight) {
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;

            this.context.configure(this.canvasConfiguration);
        }
    }

    public getRenderPassDescriptor(): GPURenderPassDescriptor {
        const colorAttachment: GPURenderPassColorAttachment = {
            view: this.context.getCurrentTexture().createView(),
            loadValue: this.clearColor,
            storeOp: 'store'
        };

        const renderPassDesc: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment],
        };

        return renderPassDesc;
    }

    public setFullcanvasViewport(renderPassEncoder: GPURenderPassEncoder): void {
        renderPassEncoder.setViewport(0, 0, this.width, this.height, 0, 1);
    }

    public setFullcanvasScissor(renderPassEncoder: GPURenderPassEncoder): void {
        renderPassEncoder.setScissorRect(0, 0, this.width, this.height);
    }
}

export {
    WebGPUCanvas,
};
