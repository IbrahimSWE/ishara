import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Header';
import ListenPage from './pages/ListenPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
    return (
        <LanguageProvider>
            <BrowserRouter>
                <Header />
                <main className="app-main">
                    <Routes>
                        <Route path="/" element={<ListenPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                    </Routes>
                </main>
            </BrowserRouter>
        </LanguageProvider>
    );
}
