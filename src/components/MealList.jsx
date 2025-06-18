import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';
import { format } from 'date-fns';

const MealRequestList = () => {
    const [requests, setRequests] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) return;
        const fetchRequests = async () => {
            const querySnapshot = await getDocs(collection(db, 'mealRequests'));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(list);
        };
        fetchRequests();
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

        alert('参加申請しました');
        setRequests(prev =>
            prev.map(r =>
                r.id === request.id
                    ? { ...r, pendingRequests: [...(r.pendingRequests || []), userId] }
                    : r
            )
        );
    };

    const renderStatus = (request) => {
        if (!user) return 'ログインしてください';

        const userId = user.uid;
        if (request.participants?.includes(userId)) return '承認済み';
        if (request.pendingRequests?.includes(userId)) return '承認待ち';
        return '申請可能';
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">食事リクエスト一覧</h2>
            {requests.length === 0 && <p>リクエストがありません</p>}
            <div className="list-group">
                {requests
                    .filter(req => req.uid !== user.uid) // 自分の投稿は除外
                    .filter(req => req.startTime.toDate() > new Date()) // 過ぎた開始時間は除外
                    .filter(req => !req.participants?.includes(user.uid)) // 承認済み除外する


                    .map(req => (
                        <div
                            key={req.id}
                            className="list-group-item list-group-item-action d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3"
                        >
                            {/* 以下は元の表示内容 */}
                            <div>
                                <p className="mb-1">
                                    <strong>投稿者: </strong> {req.username}
                                </p>
                                <p className="mb-1">
                                    <strong>日時: </strong>
                                    {format(req.startTime.toDate(), 'M月d日(EEE) HH:mm')}〜（
                                    {Math.round(req.durationHours * 60)}分）
                                </p>
                                <p className="mb-1">
                                    <strong>ジャンル・メニュー: </strong>
                                    {req.genre} / {req.menu}
                                </p>
                                <p className="mb-1">
                                    <strong>オンラインURL: </strong>
                                    {renderStatus(req) === '承認済み' ? (
                                        <a href={req.location} target="_blank" rel="noopener noreferrer">
                                            {req.location}
                                        </a>
                                    ) : (
                                        '申請後に表示'
                                    )}
                                </p>
                                <p className="mb-0">
                                    <strong>状態: </strong>
                                    {renderStatus(req)}
                                </p>
                            </div>
                            <div>
                                {renderStatus(req) === '申請可能' && (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleApply(req)}
                                    >
                                        参加申請
                                    </button>
                                )}
                                {(renderStatus(req) === '承認待ち' || renderStatus(req) === '承認済み') && (
                                    <button className="btn btn-secondary" disabled>
                                        {renderStatus(req)}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );

};

export default MealRequestList;
