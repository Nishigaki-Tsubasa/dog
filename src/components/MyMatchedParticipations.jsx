import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { FaVideo, FaUserCircle, FaComments, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const MyMatchedParticipationsOnly = () => {
    const [participantList, setParticipantList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [usernamesMap, setUsernamesMap] = useState({});

    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const fetchUsernames = async (uids) => {
            const uniqueUids = Array.from(new Set(uids));
            const map = {};
            await Promise.all(uniqueUids.map(async (uid) => {
                const userDoc = await getDoc(doc(db, 'users', uid));
                map[uid] = userDoc.exists() ? (userDoc.data().username || '匿名') : '不明';
            }));
            return map;
        };

        const fetchRequests = async () => {
            setLoading(true);
            const allRequests = [];
            const now = new Date();

            const q1 = query(collection(db, 'mealRequests'), where('participants', 'array-contains', user.uid));
            const snapshot1 = await getDocs(q1);
            for (const docSnap of snapshot1.docs) {
                const data = docSnap.data();
                if (!data.startTime || data.startTime.toDate() < now) continue;
                allRequests.push({ id: docSnap.id, ...data, isHost: false });
            }

            const q2 = query(collection(db, 'mealRequests'), where('uid', '==', user.uid));
            const snapshot2 = await getDocs(q2);
            for (const docSnap of snapshot2.docs) {
                const data = docSnap.data();
                if (!data.participants || data.participants.length === 0) continue;
                if (!data.startTime || data.startTime.toDate() < now) continue;
                allRequests.push({ id: docSnap.id, ...data, isHost: true });
            }

            const uniqueRequests = Object.values(
                allRequests.reduce((acc, item) => {
                    acc[item.id] = item;
                    return acc;
                }, {})
            );

            uniqueRequests.sort((a, b) => a.startTime.toDate() - b.startTime.toDate());

            const allUids = uniqueRequests.flatMap(req => {
                const uids = [];
                if (req.uid) uids.push(req.uid);
                if (req.participants) uids.push(...req.participants);
                return uids;
            });

            const usernameMapResult = await fetchUsernames(allUids);

            setUsernamesMap(usernameMapResult);
            setParticipantList(uniqueRequests);
            setLoading(false);
        };

        fetchRequests();
    }, [user]);

    const toggleExpand = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    if (!user) return <p className="text-center mt-4">ログインしてください</p>;

    return (
        <div className="container mt-4" style={{ maxWidth: 700 }}>
            <h2 className="mb-4 border-bottom text-center fw-bold text-dark">
                マッチングした食事の一覧
            </h2>

            {loading ? (
                <div className="text-muted text-center">読み込み中...</div>
            ) : participantList.length === 0 ? (
                <p className="text-muted text-center">マッチングした食事はありません</p>
            ) : (
                participantList.map((req) => {
                    const startDate = req.startTime.toDate();
                    const durationMinutes = Math.round(req.durationHours * 60);
                    const hostName = usernamesMap[req.uid] || '匿名';

                    return (
                        <div
                            key={req.id}
                            className="shadow-sm mb-4 p-4 rounded bg-white"
                            style={{ transition: 'transform 0.3s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="text-primary fw-semibold mb-0">
                                    {req.genre} {req.menu && `/ ${req.menu}`}
                                </h5>
                                <button
                                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                                    onClick={() => toggleExpand(req.id)}
                                    aria-expanded={expandedId === req.id}
                                    aria-controls={`details-${req.id}`}
                                >
                                    {expandedId === req.id ? <><FaChevronUp /> 閉じる</> : <><FaChevronDown /> 詳細を見る</>}
                                </button>
                            </div>

                            <p className="text-secondary small mb-3">
                                <strong>投稿者:</strong> {hostName}<br />
                                <strong>日時:</strong> {startDate.toLocaleString([], {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                })} （{durationMinutes}分）
                            </p>

                            <button
                                className="btn btn-primary w-100 mb-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                                onClick={() => navigate(`/home/jitsi/${req.roomId}`)}
                            >
                                <FaVideo size={18} /> ビデオ通話へ移動
                            </button>

                            <div
                                id={`details-${req.id}`}
                                style={{
                                    maxHeight: expandedId === req.id ? '500px' : 0,
                                    overflow: 'hidden',
                                    transition: 'max-height 0.4s ease',
                                }}
                            >
                                <h6 className="border-bottom pb-2 mb-3 text-primary fw-semibold">
                                    参加者一覧
                                </h6>

                                {/* 投稿者を表示（自分が参加者の時） */}
                                {!req.isHost && user.uid !== req.uid && (
                                    <div className="d-flex align-items-center justify-content-between mb-3 p-2 bg-info bg-opacity-10 rounded shadow-sm">
                                        <div className="d-flex align-items-center gap-2 fw-semibold text-primary">
                                            <FaUserCircle size={26} />
                                            <span>{usernamesMap[req.uid] || '匿名ホスト'}</span>
                                        </div>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <button
                                                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                                                onClick={() => navigate(`/home/profile/${req.uid}`)}
                                                aria-label={`投稿者プロフィール確認 ${usernamesMap[req.uid] || '匿名ホスト'}`}
                                            >
                                                <FaUserCircle /> プロフィール
                                            </button>
                                            <button
                                                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                                onClick={() => navigate(`/home/chatStart/${req.uid}`)}
                                                aria-label={`投稿者へチャット開始 ${usernamesMap[req.uid] || '匿名ホスト'}`}
                                            >
                                                <FaComments /> チャット
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 参加者一覧（自分は除外） */}
                                {req.participants && req.participants.length > 0 ? (
                                    req.participants.filter(uid => uid !== user.uid).map(uid => (
                                        <div
                                            key={uid}
                                            className="d-flex align-items-center justify-content-between mb-2 p-2 bg-light rounded shadow-sm"
                                        >
                                            <div className="d-flex align-items-center gap-2 fw-medium text-secondary">
                                                <FaUserCircle size={24} color="#2980b9" />
                                                <span>{usernamesMap[uid] || uid}</span>
                                            </div>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                                                    onClick={() => navigate(`/home/profile/${uid}`)}
                                                    aria-label={`プロフィール確認 ${usernamesMap[uid] || uid}`}
                                                >
                                                    <FaUserCircle />
                                                    <span className="btn-text">プロフィール</span>
                                                </button>
                                                <button
                                                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                                                    onClick={() => navigate(`/home/chatStart/${uid}`)}
                                                    aria-label={`チャット開始 ${usernamesMap[uid] || uid}`}
                                                >
                                                    <FaComments />
                                                    <span className="btn-text">チャット</span>
                                                </button>

                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted">参加者はいません。</p>
                                )}
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

export default MyMatchedParticipationsOnly;
