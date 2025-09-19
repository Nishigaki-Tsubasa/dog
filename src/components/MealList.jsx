import React, { useEffect, useState } from 'react';
import {
    collection,
    doc,
    updateDoc,
    arrayUnion,
    onSnapshot,
    addDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';
import { format } from 'date-fns';
import ja from 'date-fns/locale/ja';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import '../styles/MealListCompo.css';

const MealList = () => {
    const [requests, setRequests] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(collection(db, 'mealRequests'), (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            list.sort((a, b) => a.startTime.toDate() - b.startTime.toDate());
            setRequests(list);
        });

        return () => unsubscribe();
    }, [user]);

    const handleApply = async (request) => {
        if (!user) return alert('ログインしてください');
        const userId = user.uid;

        if (request.pendingRequests?.includes(userId) || request.participants?.includes(userId)) {
            alert('既に申請済み、または参加済みです');
            return;
        }

        const requestRef = doc(db, 'mealRequests', request.id);
        await updateDoc(requestRef, {
            pendingRequests: arrayUnion(userId),
        });

        await addDoc(collection(db, 'notifications'), {
            to: request.uid,
            from: userId,
            requestId: request.id,
            type: 'apply',
            read: false,
            timestamp: serverTimestamp(),
            message: `${request.username || '匿名'}さんがあなたの食事リクエストに参加申請しました。`,
        });
    };

    const renderStatus = (request) => {
        if (!user) return 'ログインしてください';
        const userId = user.uid;
        if (request.participants?.includes(userId)) return '承認済み';
        if (request.pendingRequests?.includes(userId)) return '承認待ち';
        return '申請可能';
    };

    return (
        <div className="container py-4" style={{ maxWidth: 900 }}>
            <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
                <h2 className="fw-bold m-0" style={{ fontSize: '1.6rem', letterSpacing: '0.05em' }}>
                    食事の一覧
                </h2>
                <button
                    className="btn MealList-btn d-flex align-items-center"
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                    onClick={() => navigate('/home/new-request')}
                >
                    <FaPlus className="me-2" /> 新規投稿
                </button>
            </div>

            {requests.length === 0 ? (
                <p className="text-muted text-center mt-5" style={{ fontSize: '0.9rem' }}>
                    リクエストがありません
                </p>
            ) : (
                <div className="row row-cols-1 row-cols-md-2 g-3 g-md-4">
                    {requests
                        .filter((req) => req.uid !== user.uid)
                        .filter((req) => req.startTime.toDate() > new Date())
                        .filter((req) => !req.participants?.includes(user.uid))
                        .map((req) => {
                            const status = renderStatus(req);
                            const isApplyEnabled = status === '申請可能';

                            return (
                                <div key={req.id} className="col">
                                    <div className="card h-100 border-0 shadow rounded-4">
                                        <div className="card-body d-flex flex-column p-3 p-md-4">
                                            <h5
                                                className="MealList-Name card-title fw-bold mb-2 mb-md-3"
                                                role="button"
                                                onClick={() => navigate(`/home/profile/${req.uid}`)}
                                                style={{ cursor: 'pointer', userSelect: 'none', fontSize: '1rem' }}
                                                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                                                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                                            >
                                                {req.username || '匿名'}
                                            </h5>

                                            <p className="card-text text-muted mb-1 small" style={{ fontSize: '0.8rem' }}>
                                                📅 {format(req.startTime.toDate(), 'M月d日(EEE) HH:mm', { locale: ja })} 〜{' '}
                                                {Math.round(req.durationHours * 60)}分
                                            </p>

                                            <p className="card-text text-muted mb-2 small" style={{ fontSize: '0.8rem' }}>
                                                🍽️ {req.genre} / {req.menu || '未設定'}
                                            </p>

                                            <div className="mt-auto text-end">
                                                {isApplyEnabled ? (
                                                    <button
                                                        className="btn MealList-btn btn-primary btn-sm px-3 px-md-4 rounded-pill"
                                                        style={{ fontSize: '0.8rem' }}
                                                        onClick={() => handleApply(req)}
                                                    >
                                                        参加申請
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={`btn my-btn btn-sm px-3 px-md-4 rounded-pill ${status === '承認済み' ? 'btn-success' : 'btn-secondary'
                                                            }`}
                                                        style={{ fontSize: '0.8rem' }}
                                                        disabled
                                                    >
                                                        {status}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            <style>{`
                .card-title:hover {
                    color: #0d6efd;
                }

                @media (max-width: 575.98px) {
                    .card-title {
                        font-size: 0.95rem;
                    }
                    .card-text {
                        font-size: 0.75rem;
                    }
                    .btn {
                        font-size: 0.75rem;
                        padding: 0.3rem 0.6rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default MealList;
