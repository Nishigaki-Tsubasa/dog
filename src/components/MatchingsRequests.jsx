import React, { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    arrayRemove,
    deleteDoc,
    arrayUnion,
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

        const fetchMyRequests = async () => {
            const q = query(collection(db, 'mealRequests'), where('uid', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const requestsData = [];
            const now = new Date(); // 現在時刻

            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data();
                const startDate = data.startTime?.toDate();

                // 未来の予定だけ残す
                if (!startDate || startDate <= now) continue;

                const pendingUIDs = data.pendingRequests || [];
                const participantsUIDs = data.participants || [];

                // 申請ユーザー情報取得
                const pendingUsers = await Promise.all(
                    pendingUIDs.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        return {
                            uid,
                            username: userDoc.exists() ? userDoc.data().username || '匿名' : '不明なユーザー',
                        };
                    })
                );

                // 参加者ユーザー情報取得
                const participantUsers = await Promise.all(
                    participantsUIDs.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        return {
                            uid,
                            username: userDoc.exists() ? userDoc.data().username || '匿名' : '不明なユーザー',
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

            // 日付が近い順にソート
            const sortedRequests = requestsData.sort(
                (a, b) => a.startTime.toDate() - b.startTime.toDate()
            );

            setMyRequests(sortedRequests);
        };

        fetchMyRequests();
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

        setMyRequests((prev) =>
            prev.map((req) => {
                if (req.id !== requestId) return req;

                const newPending = req.pendingUsers.filter((u) => u.uid !== uid);
                const newParticipants = approve
                    ? [...(req.participantUsers || []), { uid, username: '参加者' }]
                    : req.participantUsers;

                return {
                    ...req,
                    pendingUsers: newPending,
                    participantUsers: newParticipants,
                };
            })
        );
    };

    const handleRemoveParticipant = async (requestId, uid) => {
        if (!window.confirm('この参加者をリクエストから削除しますか？')) return;

        try {
            const requestRef = doc(db, 'mealRequests', requestId);

            await updateDoc(requestRef, {
                participants: arrayRemove(uid),
            });

            setMyRequests((prev) =>
                prev.map((req) =>
                    req.id === requestId
                        ? {
                            ...req,
                            participantUsers: req.participantUsers.filter((u) => u.uid !== uid),
                            participants: req.participants.filter((id) => id !== uid),
                        }
                        : req
                )
            );
        } catch (error) {
            console.error('削除失敗:', error);
            alert('削除に失敗しました。');
        }
    };

    const handleDeleteRequest = async (requestId) => {
        if (!window.confirm('このリクエストを削除しますか？')) return;

        try {
            await deleteDoc(doc(db, 'mealRequests', requestId));
            setMyRequests((prev) => prev.filter((req) => req.id !== requestId));
        } catch (error) {
            alert('削除に失敗しました');
            console.error(error);
        }
    };

    if (!user) return <p className="text-center mt-4">ログインしてください</p>;

    return (
        <div className="container mt-5" style={{ maxWidth: 700 }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="fw-bold m-0" style={{ fontSize: '1.8rem', letterSpacing: '0.05em' }}>
                    あなたの食事リクエスト一覧
                </h1>
                <button
                    className="btn Requests-btn d-flex align-items-center"
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
                            className="shadow-sm mb-4 p-4 rounded bg-white"
                            style={{ transition: 'transform 0.3s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold">{req.genre} / {req.menu}</h5>
                                    <p className="mb-1 text-muted">
                                        日時: {start.toLocaleString('ja-JP')}
                                    </p>
                                    <p className="mb-0 text-muted">時間: {duration}分</p>
                                </div>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => toggleExpand(req.id)}
                                >
                                    {expandedId === req.id ? <FaChevronUp /> : <FaChevronDown />}
                                </button>
                            </div>

                            {expandedId === req.id && (
                                <div className="mt-3">
                                    {/* 申請ユーザー一覧 */}
                                    <h6>申請中のユーザー</h6>
                                    {req.pendingUsers.length === 0 ? (
                                        <p className="text-muted">申請はありません。</p>
                                    ) : (
                                        req.pendingUsers.map((u) => (
                                            <div
                                                key={u.uid}
                                                className="d-flex justify-content-between align-items-center mb-2"
                                            >
                                                <div className="d-flex align-items-center">
                                                    <FaUserCircle className="me-2" />
                                                    {u.username}
                                                </div>
                                                <div>
                                                    <button
                                                        className="btn btn-sm btn-success me-2"
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

                                    {/* 参加者一覧 */}
                                    <h6 className="mt-3">参加者</h6>
                                    {req.participantUsers.length === 0 ? (
                                        <p className="text-muted">まだ参加者はいません。</p>
                                    ) : (
                                        req.participantUsers.map((u) => (
                                            <div
                                                key={u.uid}
                                                className="d-flex justify-content-between align-items-center mb-2"
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

                                    {/* チャット・削除 */}
                                    <div className="mt-3 d-flex gap-2">
                                        <button
                                            className="btn btn-outline-primary flex-grow-1"
                                            onClick={() => navigate(`/home/chat/${req.id}`)}
                                        >
                                            <FaComments className="me-2" /> チャット
                                        </button>
                                        <button
                                            className="btn btn-outline-danger flex-grow-1"
                                            onClick={() => handleDeleteRequest(req.id)}
                                        >
                                            <FaTrash className="me-2" /> リクエスト削除
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            <style>{`
              @media (max-width: 767.98px) {
                .btn-text {
                  display: none;
                }
              }
            `}</style>
        </div>
    );
};

export default MyRequestsWithDetails;
