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
            format: navigator.gpu.getPreferredCanvasFormat(),
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            alphaMode: "opaque",
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

    public beginRenderPass(commandEncoder: GPUCommandEncoder): GPURenderPassEncoder {
        const renderPassDescriptor = this.getRenderPassDescriptor();
        const renderPassEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        renderPassEncoder.setViewport(0, 0, this.width, this.height, 0, 1);
        renderPassEncoder.setScissorRect(0, 0, this.width, this.height);
        return renderPassEncoder;
    }

    private getRenderPassDescriptor(): GPURenderPassDescriptor {
        const colorAttachment: GPURenderPassColorAttachment = {
            view: this.context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: this.clearColor,
            storeOp: 'store'
        };

        const renderPassDesc: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment],
        };

        return renderPassDesc;
    }
}

export {
    WebGPUCanvas,
};
