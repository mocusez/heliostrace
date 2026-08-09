import { afterEach, describe, expect, it } from 'vitest';
import React from 'react';
import { AppContextProvider } from '../src/app_context';
import { appContext } from '../src/app_config';
import FileUploader from '../src/components/utils/containers/file_uploader';
import * as model from '../src/model';
import { cleanupDom, renderWithStore } from './helpers';

describe('FileUploader public surface', () => {
    afterEach(cleanupDom);

    it('accepts only HeliosTrace files and does not offer bundled samples', () => {
        const container = renderWithStore(
            <AppContextProvider value={appContext}>
                <FileUploader />
            </AppContextProvider>,
            model.createStore(),
        );

        const input = container.querySelector<HTMLInputElement>('input[type="file"]');
        expect(input).not.toBeNull();
        expect(input!.accept).toBe('.heliostrace');
        expect(container.textContent).not.toContain('Sample Files');
    });
});
