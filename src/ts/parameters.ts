// import "./page-interface-generated";

const controlId = {
    PARTICLES_COUNT_ID: "particles-count-range-id",
    SPEED_RANGE_ID: "speed-range-id",
    ATTRACTION_RANGE_ID: "attraction-range-id",
    FRICTION_RANGE_ID: "friction-range-id",
    BOUNCE_CHECKBOX_ID: "bounce-checkbox-id",
    GRAVITY_RANGE_ID: "gravity-range-id",
    RESET_BUTTON_ID: "reset-button-id",

    SPRITE_SIZE_RANGE_ID: "sprite-size-range-id",
    OPACITY_RANGE_ID: "opacity-range-id",
    PARTICLE_COLORPICKER_ID: "particle-color-id",
};

type ResetObserver = () => void;

abstract class Parameters {
    public static readonly resetObservers: ResetObserver[] = [];

    public static get particlesCount(): number {
        return 100000 * Page.Range.getValue(controlId.PARTICLES_COUNT_ID);
    }
    public static get speed(): number {
        return Page.Range.getValue(controlId.SPEED_RANGE_ID);
    }
    public static get attraction(): number {
        return Page.Range.getValue(controlId.ATTRACTION_RANGE_ID);
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

    public static get spriteSize(): number {
        return Page.Range.getValue(controlId.SPRITE_SIZE_RANGE_ID);
    }
    public static get opacity(): number {
        return Page.Range.getValue(controlId.OPACITY_RANGE_ID);
    }
    public static get particleColor(): [number, number, number] {
        const color = Page.ColorPicker.getValue(controlId.PARTICLE_COLORPICKER_ID);
        return [color.r / 255, color.g / 255, color.g / 255];
    }
}

function callResetObservers(): void {
    for (const observer of Parameters.resetObservers) {
        observer();
    }
}

Page.Range.addLazyObserver(controlId.PARTICLES_COUNT_ID, callResetObservers);
Page.Button.addObserver(controlId.RESET_BUTTON_ID, callResetObservers);

export {
    Parameters,
};
