import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import * as model from '../src/model';

// React 17: render into a fresh container per test (no react-dom/client here)
export function renderWithStore(element: React.ReactElement, store: model.AppReduxStore): HTMLElement {
    const container = document.createElement('div');
    document.body.appendChild(container);
    ReactDOM.render(<Provider store={store}>{element}</Provider>, container);
    return container;
}

export function cleanupDom(): void {
    Array.from(document.body.children).forEach(child => {
        ReactDOM.unmountComponentAtNode(child);
        child.remove();
    });
}

export function waitFor(predicate: () => boolean, timeoutMs = 30_000, intervalMs = 100): Promise<void> {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const tick = () => {
            if (predicate()) return resolve();
            if (Date.now() - start > timeoutMs) return reject(new Error('waitFor timed out'));
            setTimeout(tick, intervalMs);
        };
        tick();
    });
}
