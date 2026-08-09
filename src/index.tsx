import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import { initTheme } from './style/theme';

initTheme();

const element = document.getElementById('root');

createRoot(element!).render(<App/>);
