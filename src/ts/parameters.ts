// import "./page-interface-generated";

const controlId = {
    SPEED_RANGE_ID: "speed-range-id",
    BOUNCE_CHECKBOX_ID: "bounce-checkbox-id",
};

abstract class Parameters {
    public static get speed(): number {
        return Page.Range.getValue(controlId.SPEED_RANGE_ID);
    }
    public static get bounce(): boolean {
        return Page.Checkbox.isChecked(controlId.BOUNCE_CHECKBOX_ID);
    }
}

export {
    Parameters,
};
