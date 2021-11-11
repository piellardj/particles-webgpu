import ImageUrlLadybug from "../resources/ladybug.png";
import ImageUrlColors from "../resources/colors.png";

// import "./page-interface-generated";

const controlId = {
    PARTICLES_COUNT_ID: "particles-count-range-id",
    SPEED_RANGE_ID: "speed-range-id",
    FRICTION_RANGE_ID: "friction-range-id",
    BOUNCE_CHECKBOX_ID: "bounce-checkbox-id",
    GRAVITY_RANGE_ID: "gravity-range-id",
    RESET_BUTTON_ID: "reset-button-id",

    ATTRACTION_RANGE_ID: "attraction-range-id",
    ATTRACTORS_PRESET_SELECT_ID: "attractors-preset-select-id",
    ATTRACTORS_DISPLAY_CHECKBOX_ID: "display-attractors-checkbox-id",

    COLOR_MODE_TABS_ID: "colors-mode-tabs-id",
    COLOR_AUTO_CHECKBOX_ID: "auto-color-checkbox-id",
    PARTICLE_COLORPICKER_ID: "particle-color-id",
    IMAGE_SELECT_ID: "image-preset-select-id",
    IMAGE_UPLOAD_BUTTON_ID: "input-image-upload-button",

    SPRITE_SIZE_RANGE_ID: "sprite-size-range-id",
    OPACITY_RANGE_ID: "opacity-range-id",
};

type ResetObserver = () => void;

enum AttractorsPreset {
    NONE = "none",
    ORBIT = "orbit",
    SINES = "sines",
    CENTRAL_ATTRACTIVE = "central-attractive",
    CENTRAL_REPULSIVE = "central-repulsive",
}

enum ColorMode {
    UNICOLOR = "unicolor",
    MULTICOLOR = "multicolor",
}

enum ImagePreset {
    COLORS = "colors",
    LADYBUG = "ladybug"
}

let customImageFile: File = null;

abstract class Parameters {
    public static readonly resetObservers: ResetObserver[] = [];

    public static get particlesCount(): number {
        return 1000000 * Page.Range.getValue(controlId.PARTICLES_COUNT_ID);
    }
    public static get speed(): number {
        return Page.Range.getValue(controlId.SPEED_RANGE_ID);
    }
    public static get friction(): number {
        return Page.Range.getValue(controlId.FRICTION_RANGE_ID);
    }
    public static get bounce(): boolean {
        return Page.Checkbox.isChecked(controlId.BOUNCE_CHECKBOX_ID);
    }
    public static get gravity(): number {
        return Page.Range.getValue(controlId.GRAVITY_RANGE_ID);
    }

    public static get attraction(): number {
        return Page.Range.getValue(controlId.ATTRACTION_RANGE_ID);
    }
    public static get attractorsPreset(): AttractorsPreset {
        return Page.Select.getValue(controlId.ATTRACTORS_PRESET_SELECT_ID) as AttractorsPreset;
    }
    public static get displayAttractors(): boolean {
        return Page.Checkbox.isChecked(controlId.ATTRACTORS_DISPLAY_CHECKBOX_ID);
    }

    public static get colorMode(): ColorMode {
        return Page.Tabs.getValues(controlId.COLOR_MODE_TABS_ID)[0] as ColorMode;
    }
    public static get autoColor(): boolean {
        return Page.Checkbox.isChecked(controlId.COLOR_AUTO_CHECKBOX_ID);
    }
    public static get particleColor(): [number, number, number] {
        if (Parameters.autoColor) {
            const cycleLength = 60000;
            const now = (performance.now() % cycleLength) / cycleLength * 6;
            const min = 0.2;
            let r = min, g = min, b = min;
            if (now < 1) {
                r = 1;
                g = min + (1 - min) * now;
            } else if (now < 2) {
                r = min + (1 - min) * (2 - now);
                g = 1;
            } else if (now < 3) {
                g = 1;
                b = min + (1 - min) * (now - 2);
            } else if (now < 4) {
                g = min + (1 - min) * (4 - now);
                b = 1;
            } else if (now < 5) {
                r = min + (1 - min) * (now - 4);
                b = 1;
            } else {
                r = 1;
                b = min + (1 - min) * (6 - now);
            }
            return [r, g, b];
        } else {
            const color = Page.ColorPicker.getValue(controlId.PARTICLE_COLORPICKER_ID);
            return [color.r / 255, color.g / 255, color.b / 255];
        }
    }
    public static async inputImageUrl(): Promise<string> {
        if (customImageFile) {
            return new Promise<string>((resolve: (value: string) => void) => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve(reader.result.toString());
                };
                reader.readAsDataURL(customImageFile);
            });
        } else {
            const imagePreset = Page.Select.getValue(controlId.IMAGE_SELECT_ID) as ImagePreset;
            if (imagePreset === ImagePreset.COLORS) {
                return ImageUrlColors;
            } else {
                return ImageUrlLadybug;
            }
        }
    }

    public static get spriteSize(): number {
        return Page.Range.getValue(controlId.SPRITE_SIZE_RANGE_ID);
    }
    public static get opacity(): number {
        return Page.Range.getValue(controlId.OPACITY_RANGE_ID);
    }
}

function callResetObservers(): void {
    for (const observer of Parameters.resetObservers) {
        observer();
    }
}

function updateColorsVisibility(): void {
    const isUnicolor = (Parameters.colorMode === ColorMode.UNICOLOR);
    Page.Controls.setVisibility(controlId.COLOR_AUTO_CHECKBOX_ID, isUnicolor);
    Page.Controls.setVisibility(controlId.PARTICLE_COLORPICKER_ID, isUnicolor && !Parameters.autoColor);
    Page.Controls.setVisibility(controlId.IMAGE_SELECT_ID, !isUnicolor);
    Page.Controls.setVisibility(controlId.IMAGE_UPLOAD_BUTTON_ID, !isUnicolor);
}

Page.Range.addLazyObserver(controlId.PARTICLES_COUNT_ID, callResetObservers);
Page.Button.addObserver(controlId.RESET_BUTTON_ID, callResetObservers);
Page.Tabs.addObserver(controlId.COLOR_MODE_TABS_ID, () => {
    updateColorsVisibility();
    if (Parameters.colorMode === ColorMode.MULTICOLOR) {
        callResetObservers();
    }
});
Page.Checkbox.addObserver(controlId.COLOR_AUTO_CHECKBOX_ID, updateColorsVisibility);
Page.Select.addObserver(controlId.IMAGE_SELECT_ID, () => {
    customImageFile = null;
    Page.FileControl.clearFileUpload(controlId.IMAGE_UPLOAD_BUTTON_ID);
    callResetObservers();
});

Page.FileControl.addUploadObserver(controlId.IMAGE_UPLOAD_BUTTON_ID, (filesList: FileList) => {
    Page.Select.setValue(controlId.IMAGE_SELECT_ID, null);
    customImageFile = filesList[0];
    callResetObservers();
});

updateColorsVisibility();

export {
    AttractorsPreset,
    ColorMode,
    Parameters,
};
