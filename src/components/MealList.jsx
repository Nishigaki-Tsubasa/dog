import React, { useEffect, useState } from 'react';
import { collection, doc, updateDoc, arrayUnion, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';
import { format } from 'date-fns';
import ja from 'date-fns/locale/ja';
import { useNavigate } from 'react-router-dom';

const MealList = () => {
    const [requests, setRequests] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const unsubscribe = onSnapshot(collection(db, 'mealRequests'), (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // 日付が近い順にソート
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

        //alert('参加申請しました');
    };

    const renderStatus = (request) => {
        if (!user) return 'ログインしてください';
        const userId = user.uid;
        if (request.participants?.includes(userId)) return '承認済み';
        if (request.pendingRequests?.includes(userId)) return '承認待ち';
        return '申請可能';
    };

    return (
        <div className="container mt-4" style={{ maxWidth: 900 }}>
            <h2 className="mb-4 text-center fw-bold">食事の一覧</h2>
            {requests.length === 0 ? (
                <p className="text-muted text-center mt-5">リクエストがありません</p>
            ) : (
                <div className="row row-cols-1 row-cols-md-2 g-4">
                    {requests
                        .filter(req => req.uid !== user.uid)
                        .filter(req => req.startTime.toDate() > new Date())
                        .filter(req => !req.participants?.includes(user.uid))
                        .map(req => {
                            const status = renderStatus(req);
                            const isApplyEnabled = status === '申請可能';

                            return (
                                <div key={req.id} className="col">
                                    <div className="card h-100 shadow rounded-3">
                                        <div className="card-body d-flex flex-column">
                                            <h5
                                                className="card-title text-primary"
                                                role="button"
                                                onClick={() => navigate(`/home/profile/${req.uid}`)}
                                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                            >
                                                {req.username || '匿名'}
                                            </h5>

                                            <p className="card-text mb-1 text-secondary small">
                                                <strong>日時:</strong>{' '}
                                                {format(req.startTime.toDate(), 'M月d日(EEE) HH:mm', { locale: ja })}〜（
                                                {Math.round(req.durationHours * 60)}分）
                                            </p>
                                            <p className="card-text mb-3 text-secondary small">
                                                <strong>ジャンル・メニュー:</strong> {req.genre} / {req.menu || '未設定'}
                                            </p>

                                            <div className="mt-auto text-end">
                                                {isApplyEnabled ? (
                                                    <button
                                                        className="btn btn-primary btn-sm px-3"
                                                        onClick={() => handleApply(req)}
                                                    >
                                                        参加申請
                                                    </button>
                                                ) : (
                                                    <button
                                                        className={`btn btn-sm px-3 ${status === '承認済み' ? 'btn-success' : 'btn-secondary'
                                                            }`}
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
        </div>
    );
};

export default MealList;
