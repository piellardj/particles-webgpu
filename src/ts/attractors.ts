import { AttractorsPreset, Parameters } from "./parameters";

type Force = [number, number];
type Attractor = {
    position: [number, number];
    force: number;
}

let time = 0;

let container: HTMLElement;
const className = "attractor-overlay";

function setContainer(element: HTMLElement): void {
    container = element;
}

function setOverlays(attractors: Attractor[]): void {
    if (!container) {
        throw new Error("A container is needed for overlays.");
    }

    if (!Parameters.displayAttractors) {
        const elements = Array.from(container.querySelectorAll<HTMLElement>(`.${className}`));
        while (elements.length > 0) {
            const lastElement = elements.pop();
            lastElement.parentElement.removeChild(lastElement);
        }
        return;
    }

    const elements = Array.from(container.querySelectorAll<HTMLElement>(`.${className}`));
    while (elements.length > attractors.length) {
        const lastElement = elements.pop();
        lastElement.parentElement.removeChild(lastElement);
    }
    while (elements.length < attractors.length) {
        const newElement = document.createElement("span");
        newElement.className = className;
        container.appendChild(newElement);
        elements.push(newElement);
    }

    for (let i = 0; i < elements.length; i++) {
        const x = 100 * (0.5 + 0.5 * attractors[i].position[0]);
        const y = 100 * (0.5 + 0.5 * attractors[i].position[1]);
        elements[i].style.left = `${x.toFixed(2)}%`;
        elements[i].style.top = `${y.toFixed(2)}%`;
    }
}

function getPreset(): Attractor[] {
    const attractorsList: Attractor[] = [];

    /* eslint indent: "off" */
    const preset = Parameters.attractorsPreset;
    switch (preset) {
        case AttractorsPreset.ORBIT:
            {
                attractorsList.push({
                    force: 7,
                    position: [0, 0],
                });
                attractorsList.push({
                    force: 5,
                    position: [0.4 * Math.cos(time), 0.4 * Math.sin(time)],
                });
                attractorsList.push({
                    force: 6,
                    position: [0.8 * Math.cos(-0.9 * time), 0.8 * Math.sin(-0.9 * time)],
                });
                break;
            }
        case AttractorsPreset.SINES:
            {
                attractorsList.push({
                    force: 7,
                    position: [0.7 * Math.cos(time), 0.7 * Math.sin(2 * time)],
                });
                attractorsList.push({
                    force: 7,
                    position: [0.7 * Math.cos(1.8 * (time + 0.5)), 0.7 * Math.sin(0.9 * (time + 0.5))],
                });
                break;
            }
        case AttractorsPreset.CENTRAL_ATTRACTIVE:
            {
                attractorsList.push({
                    force: 5,
                    position: [0, 0],
                });
                break;
            }
        case AttractorsPreset.CENTRAL_REPULSIVE:
            {
                attractorsList.push({
                    force: -5,
                    position: [0, 0],
                });
                break;
            }
        default:
            break;
    }

    const containerBox = container.getBoundingClientRect();
    const aspectRatio = containerBox.width / containerBox.height;

    for (const attractor of attractorsList) {
        attractor.position[0] /= aspectRatio;
    }

    return attractorsList;
}

function update(dt: number): void {
    time += dt;
}

export {
    getPreset,
    setOverlays,
    setContainer,
    update,
};
export type {
    Attractor,
    Force,
};
