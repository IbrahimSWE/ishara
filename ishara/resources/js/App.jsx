import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ListenPage from './pages/ListenPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
    return (
        <BrowserRouter>
            <header className="app-header">
                <span className="app-header__title">Ishara — إشارة</span>
            </header>
            <main className="app-main">
                <Routes>
                    <Route path="/" element={<ListenPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}
