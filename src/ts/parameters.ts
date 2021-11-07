// import "./page-interface-generated";

const controlId = {
    SPEED_RANGE_ID: "speed-range-id",
    FRICTION_RANGE_ID: "friction-range-id",
    BOUNCE_CHECKBOX_ID: "bounce-checkbox-id",
    RESET_BUTTON_ID: "reset-button-id",
};

type ResetObserver = () => void;

abstract class Parameters {
    public static readonly resetObservers: ResetObserver[] = [];

    public static get speed(): number {
        return Page.Range.getValue(controlId.SPEED_RANGE_ID);
    }
    public static get friction(): number {
        return Page.Range.getValue(controlId.FRICTION_RANGE_ID);
    }
    public static get bounce(): boolean {
        return Page.Checkbox.isChecked(controlId.BOUNCE_CHECKBOX_ID);
    }
}

function callResetObservers(): void {
    for (const observer of Parameters.resetObservers) {
        observer();
    }
}

Page.Button.addObserver(controlId.RESET_BUTTON_ID, callResetObservers);

export {
    Parameters,
};
