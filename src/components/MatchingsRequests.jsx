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

            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data();
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

            setMyRequests(requestsData);
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
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                {/* 食事ジャンル/料理名 */}
                                <h5 className="fw-semibold mb-0"
                                    style={{ color: '#ff6f61' }}>
                                    {req.genre} {req.menu && `/ ${req.menu}`}
                                </h5>
                                <button
                                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                                    onClick={() => toggleExpand(req.id)}
                                >
                                    {expandedId === req.id ? (
                                        <>
                                            <FaChevronUp /> 閉じる
                                        </>
                                    ) : (
                                        <>
                                            <FaChevronDown /> 詳細
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-secondary small mb-3">
                                <strong>日時:</strong> {start.toLocaleString([], {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })}（{duration}分）

                                <br />
                                <strong>上限:</strong> {req.participantsLimit || 'なし'}人
                            </p>

                            <div
                                style={{
                                    maxHeight: expandedId === req.id ? '1000px' : 0,
                                    overflow: 'hidden',
                                    transition: 'max-height 0.4s ease',
                                }}
                            >
                                <h6 className="fw-bold mt-3"
                                    style={{ color: '#ff6f61' }}>申請ユーザー</h6>
                                {req.pendingUsers.length === 0 ? (
                                    <p className="text-muted"
                                        style={{ color: '#ff6f61' }}>申請者なし</p>
                                ) : (
                                    req.pendingUsers.map((u) => (
                                        <div
                                            key={u.uid}
                                            className="d-flex fw-bold justify-content-between align-items-center p-2 rounded mb-2 shadow-sm"
                                            style={{ backgroundColor: '#fffcf1' }}
                                        >
                                            <div className="d-flex align-items-center gap-2 text-secondary">

                                                <FaUserCircle size={20} color="#ff6f61" />
                                                {u.username}
                                            </div>
                                            <div className="d-flex gap-1">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"

                                                    onClick={() => navigate(`/home/profile/${u.uid}`)}
                                                    aria-label={`プロフィール確認 ${u.username}`}
                                                >
                                                    <FaUserCircle />
                                                    <span className="btn-text">プロフィール</span>
                                                </button>

                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleApproval(req.id, u.uid, true)}
                                                >
                                                    <FaCheck />
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleApproval(req.id, u.uid, false)}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <h6 className="fw-bold mt-4"
                                    style={{ color: '#ff6f61' }}>参加者</h6>
                                {req.participantUsers.length === 0 ? (
                                    <p className="text-muted"
                                        style={{ color: '#ff6f61' }}>参加者なし</p>
                                ) : (
                                    req.participants &&
                                    req.participants.length > 0 &&
                                    req.participants
                                        .filter((uid) => uid !== user.uid)
                                        .map((uid) => (
                                            <div
                                                key={uid}
                                                className="d-flex fw-bold align-items-center justify-content-between mb-2 p-2 rounded shadow-sm"
                                                style={{ backgroundColor: '#fffcf1', }}
                                            >
                                                <div className="d-flex align-items-center gap-2 fw-medium text-secondary">
                                                    <FaUserCircle size={24} color="#ff6f61" />
                                                    <span>{req.participantUsers.find(u => u.uid === uid)?.username || usernamesMap[uid] || uid}</span>
                                                </div>

                                                <div className="d-flex gap-2 flex-wrap">
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                                                        onClick={() => navigate(`/home/profile/${uid}`)}
                                                        aria-label={`プロフィール確認 ${req.participantUsers.find(u => u.uid === uid)?.username || usernamesMap[uid] || uid}`}
                                                    >
                                                        <FaUserCircle />
                                                        <span className="btn-text">プロフィール</span>
                                                    </button>

                                                    <button
                                                        className="btn Requests-btn2 btn-sm d-flex align-items-center gap-1"
                                                        onClick={() => navigate(`/home/chatStart/${uid}`)}
                                                        aria-label={`チャット開始 ${req.participantUsers.find(u => u.uid === uid)?.username || usernamesMap[uid] || uid}`}
                                                    >
                                                        <FaComments />
                                                        <span className="btn-text">チャット</span>
                                                    </button>

                                                    <button
                                                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                                                        onClick={() => handleRemoveParticipant(req.id, uid)}
                                                    >
                                                        <FaTrash />
                                                        <span className="btn-text">削除</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                )}

                                <div className="text-end mt-4">
                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => handleDeleteRequest(req.id)}
                                    >
                                        <FaTrash className="me-1" /> 投稿を削除する
                                    </button>
                                </div>
                            </div>
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
