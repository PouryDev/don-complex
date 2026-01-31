import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import SupervisorApp from './SupervisorApp';

const container = document.getElementById('supervisor-app');

if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <SupervisorApp />
            </BrowserRouter>
        </React.StrictMode>
    );
}

