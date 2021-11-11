import { Parameters } from "./parameters";

type Force = [number, number];
type Attractor = {
    position: [number, number];
    force: number;
}

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

export {
    setOverlays,
    setContainer,
};
export type {
    Attractor,
    Force,
};
