import '../css/app.css';
import './bootstrap';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import CashierApp from './CashierApp';

const container = document.getElementById('cashier-app');

if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <CashierApp />
            </BrowserRouter>
        </React.StrictMode>
    );
}

