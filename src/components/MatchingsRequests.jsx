import React, { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    arrayRemove,
    deleteDoc,
    arrayUnion,
    onSnapshot,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import {
    FaChevronDown,
    FaChevronUp,
    FaCheck,
    FaTimes,
    FaTrash,
    FaUserCircle,
    FaPlus,
    FaComments,
} from 'react-icons/fa';
import '../styles/MatchingsRequests.css';

const MyRequestsWithDetails = () => {
    const [myRequests, setMyRequests] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, 'mealRequests'), where('uid', '==', user.uid));

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const requestsData = [];
            const now = new Date();

            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data();
                const startDate = data.startTime?.toDate();
                if (!startDate || startDate <= now) continue;

                const pendingUIDs = data.pendingRequests || [];
                const participantsUIDs = data.participants || [];

                const pendingUsers = await Promise.all(
                    pendingUIDs.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        return {
                            uid,
                            username: userDoc.exists() ? userDoc.data().username || '匿名' : '不明',
                        };
                    })
                );

                const participantUsers = await Promise.all(
                    participantsUIDs.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        return {
                            uid,
                            username: userDoc.exists() ? userDoc.data().username || '匿名' : '不明',
                        };
                    })
                );

                requestsData.push({
                    id: docSnap.id,
                    ...data,
                    pendingUsers,
                    participantUsers,
                });
            }

            const sortedRequests = requestsData.sort(
                (a, b) => a.startTime.toDate() - b.startTime.toDate()
            );

            setMyRequests(sortedRequests);
        });

        return () => unsubscribe();
    }, [user]);

    const toggleExpand = (id) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const handleApproval = async (requestId, uid, approve) => {
        const requestRef = doc(db, 'mealRequests', requestId);

        await updateDoc(requestRef, {
            ...(approve && { participants: arrayUnion(uid) }),
            pendingRequests: arrayRemove(uid),
        });
    };

    const handleRemoveParticipant = async (requestId, uid) => {
        try {
            const requestRef = doc(db, 'mealRequests', requestId);

            await updateDoc(requestRef, {
                participants: arrayRemove(uid),
            });
        } catch (error) {
            console.error('削除失敗:', error);
            alert('削除に失敗しました。');
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm('削除しますか？')) return;

        try {
            await deleteDoc(doc(db, 'mealRequests', requestId));
        } catch (error) {
            alert('削除に失敗しました');
            console.error(error);
        }
    };

    if (!user) return <p className="text-center mt-4">ログインしてください</p>;

    return (
        <div className="container mt-5" style={{ maxWidth: 700 }}>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <h1
                    className="fw-bold m-0"
                    style={{ fontSize: '1.5rem', letterSpacing: '0.05em' }}
                >
                    投稿したリクエスト
                </h1>
                <button
                    className="btn MealList-btn d-flex align-items-center"
                    style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}
                    onClick={() => navigate('/home/new-request')}
                >
                    <FaPlus className="me-2" /> 新規投稿
                </button>
            </div>

            {myRequests.length === 0 ? (
                <p className="text-muted text-center">リクエストはまだありません。</p>
            ) : (
                myRequests.map((req) => {
                    const start = req.startTime.toDate();
                    const duration = Math.round((req.durationHours || 0) * 60);

                    return (
                        <div
                            key={req.id}
                            className="shadow-sm mb-4 p-3 p-md-4 rounded bg-white"
                            style={{ transition: 'transform 0.3s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <div className="d-flex justify-content-between align-items-start flex-wrap">
                                <div>
                                    <h5 className="fw-bold mb-1" style={{ fontSize: '1rem' }}>
                                        {req.genre} / {req.menu}
                                    </h5>
                                    <p className="mb-1 text-muted" style={{ fontSize: '0.85rem' }}>
                                        日時: {start.toLocaleString('ja-JP')}
                                    </p>
                                    <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                                        時間: {duration}分
                                    </p>
                                </div>
                                <button
                                    className="btn btn-sm btn-outline-secondary mt-2 mt-md-0"
                                    onClick={() => toggleExpand(req.id)}
                                >
                                    {expandedId === req.id ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                            </div>

                            {expandedId === req.id && (
                                <div className="mt-3">
                                    <h6 style={{ fontSize: '0.9rem' }}>申請中</h6>
                                    {req.pendingUsers.length === 0 ? (
                                        <p className="text-muted">なし</p>
                                    ) : (
                                        req.pendingUsers.map((u) => (
                                            <div
                                                key={u.uid}
                                                className="d-flex justify-content-between align-items-center mb-1"
                                            >
                                                <div className="d-flex align-items-center">
                                                    <FaUserCircle className="me-2" />
                                                    {u.username}
                                                </div>
                                                <div>
                                                    <button
                                                        className="btn btn-sm btn-success me-1"
                                                        onClick={() => handleApproval(req.id, u.uid, true)}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleApproval(req.id, u.uid, false)}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    <h6 className="mt-2" style={{ fontSize: '0.9rem' }}>参加者</h6>
                                    {req.participantUsers.length === 0 ? (
                                        <p className="text-muted">なし</p>
                                    ) : (
                                        req.participantUsers.map((u) => (
                                            <div
                                                key={u.uid}
                                                className="d-flex justify-content-between align-items-center mb-1"
                                            >
                                                <div className="d-flex align-items-center">
                                                    <FaUserCircle className="me-2" />
                                                    {u.username}
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleRemoveParticipant(req.id, u.uid)}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        ))
                                    )}

                                    <div className="mt-2 d-flex gap-2 flex-wrap">
                                        {/* チャットボタンは必要なら有効化 */}
                                        <button
                                            className="btn btn-outline-danger flex-grow-1"
                                            onClick={() => handleDeleteRequest(req.id)}
                                        >
                                            <FaTrash className="me-1" /> 削除
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default MyRequestsWithDetails;
