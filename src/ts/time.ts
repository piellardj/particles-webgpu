import { Parameters } from "./parameters";

let now: number;
let lastCheckpoint: number;
let speed: number;

function getTime(): number {
    return now + (performance.now() - lastCheckpoint) * speed;
}

Parameters.speedChangeObservers.push(() => {
    now = getTime();
    lastCheckpoint = performance.now();
    speed = Parameters.speed;
});

function reset(): void {
    now = 0;
    lastCheckpoint = performance.now();
    speed = Parameters.speed;
}

reset();

export {
    reset,
    getTime,
};
