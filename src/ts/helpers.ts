function bytesToString(bytes: number): string {
    let quantity: number;
    let unit: string;

    if (bytes < 1024) {
        quantity = bytes;
        unit = "B";
    } else if (bytes < 1024 * 1024) {
        quantity = bytes / 1024;
        unit = "KB";
    } else {
        quantity = bytes / 1024 / 1024;
        unit = "MB";
    }

    return Math.ceil(quantity).toLocaleString() + " " + unit;
}

export {
    bytesToString,
};
