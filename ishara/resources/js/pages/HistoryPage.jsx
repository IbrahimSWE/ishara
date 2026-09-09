import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function HistoryPage() {
    const { t } = useLanguage();
    const [sessions, setSessions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [detailLoadError, setDetailLoadError] = useState(false);

    useEffect(() => {
        fetch(`/api/sessions?page=${currentPage}`, { headers: { Accept: 'application/json' } })
            .then((response) => {
                if (!response.ok) throw new Error('failed to load');
                return response.json();
            })
            .then((data) => {
                setSessions(data.data);
                setLastPage(data.last_page);
            })
            .catch(() => setLoadError(true));
        setSelectedId(null);
    }, [currentPage]);

    useEffect(() => {
        if (selectedId === null) {
            setSelectedSession(null);
            setDetailLoadError(false);
            return;
        }

        setDetailLoadError(false);
        fetch(`/api/sessions/${selectedId}`, { headers: { Accept: 'application/json' } })
            .then((response) => {
                if (!response.ok) throw new Error('failed to load');
                return response.json();
            })
            .then((data) => setSelectedSession(data))
            .catch(() => setDetailLoadError(true));
    }, [selectedId]);

    if (loadError) {
        return <p className="history-page__error">{t('historyLoadError')}</p>;
    }

    return (
        <div className="history-page">
            <ul className="history-page__list">
                {sessions.map((session) => (
                    <li key={session.id}>
                        <button type="button" onClick={() => setSelectedId(session.id)}>
                            <span>{new Date(session.started_at).toLocaleString()}</span>
                            <span>{session.spoken_language}</span>
                            <span dir="auto">{session.full_text.slice(0, 80)}</span>
                        </button>
                    </li>
                ))}
            </ul>

            <div className="history-page__pagination">
                <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page - 1)}
                    disabled={currentPage === 1}
                >
                    {t('historyPrevPage')}
                </button>
                <button
                    type="button"
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={currentPage === lastPage}
                >
                    {t('historyNextPage')}
                </button>
            </div>

            {selectedId !== null && (
                <div className="history-page__detail">
                    {detailLoadError ? (
                        <p className="history-page__detail-error">{t('historyDetailLoadError')}</p>
                    ) : selectedSession ? (
                        <>
                            <h2>{new Date(selectedSession.started_at).toLocaleString()}</h2>
                            <p dir="auto">{selectedSession.full_text}</p>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}
