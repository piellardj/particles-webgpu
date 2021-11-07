// import "./page-interface-generated";

const controlId = {
    BOUNCE_CHECKBOX_ID: "bounce-checkbox-id",
};

abstract class Parameters {
    public static get bounce(): boolean {
        return Page.Checkbox.isChecked(controlId.BOUNCE_CHECKBOX_ID);
    }
}

export {
    Parameters,
};
