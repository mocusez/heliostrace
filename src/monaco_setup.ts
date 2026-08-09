// Wire @monaco-editor/react to the locally bundled monaco-editor instead of
// its default CDN download, and provide the editor core worker via Vite.
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

(self as any).MonacoEnvironment = {
    getWorker: () => new EditorWorker(),
};

loader.config({ monaco });
