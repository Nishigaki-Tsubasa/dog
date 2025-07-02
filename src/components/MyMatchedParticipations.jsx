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
            <h2 className="mb-4 border-bottom text-center" style={{ fontWeight: '700', color: '#333' }}>
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
                            className="shadow-sm mb-4"
                            style={{
                                borderRadius: 12,
                                padding: 20,
                                background: '#fff', // 真っ白
                                boxShadow: '0 4px 10px rgba(0,0,0,0.08)', // 柔らかい薄い影
                                transition: 'transform 0.3s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 style={{ color: '#2c3e50', fontWeight: 600 }}>
                                    {req.genre} {req.menu && `/ ${req.menu}`}
                                </h5>
                                <button
                                    className="btn btn-sm"
                                    style={{
                                        minWidth: 100,
                                        backgroundColor: '#ecf0f1', // 淡いグレー青み
                                        color: '#34495e',
                                        border: 'none',
                                        boxShadow: 'none',
                                    }}
                                    onClick={() => toggleExpand(req.id)}
                                    aria-expanded={expandedId === req.id}
                                    aria-controls={`details-${req.id}`}
                                >
                                    {expandedId === req.id ? <><FaChevronUp /> 閉じる</> : <><FaChevronDown /> 詳細を見る</>}
                                </button>
                            </div>

                            <p style={{ fontSize: 14, color: '#34495e', marginBottom: 12 }}>
                                <strong>投稿者:</strong> {hostName}<br />
                                <strong>日時:</strong> {startDate.toLocaleString()} （{durationMinutes}分）
                            </p>

                            <button
                                className="btn d-flex align-items-center justify-content-center gap-2 mb-3"
                                style={{
                                    width: '100%',
                                    fontWeight: '600',
                                    fontSize: 16,
                                    backgroundColor: '#3498db', // 落ち着いた青
                                    color: '#fff',
                                    border: 'none',
                                    boxShadow: '0 2px 6px rgba(52,152,219,0.4)',
                                }}
                                onClick={() => navigate(`/home/jitsi/${req.roomId}`)}
                            >
                                <FaVideo size={18} /> ビデオ通話へ移動
                            </button>

                            <div
                                id={`details-${req.id}`}
                                style={{
                                    maxHeight: expandedId === req.id ? 500 : 0,
                                    overflow: 'hidden',
                                    transition: 'max-height 0.4s ease',
                                }}
                            >
                                <h6 style={{ borderBottom: '1px solid #bdc3c7', paddingBottom: 8, marginBottom: 12, color: '#2c3e50' }}>
                                    参加者一覧
                                </h6>

                                {req.participants && req.participants.length > 0 ? (
                                    req.participants.map(uid => (
                                        <div
                                            key={uid}
                                            className="d-flex align-items-center justify-content-between mb-2"
                                            style={{
                                                background: '#f9f9f9',
                                                borderRadius: 8,
                                                padding: '6px 12px',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            }}
                                        >
                                            <div className="d-flex align-items-center gap-2" style={{ fontWeight: 500, color: '#34495e' }}>
                                                <FaUserCircle size={24} color="#2980b9" />
                                                <span>{usernamesMap[uid] || uid}</span>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => navigate(`/home/profile/${uid}`)}
                                                    aria-label={`プロフィール確認 ${usernamesMap[uid] || uid}`}
                                                    style={{ color: '#34495e', borderColor: '#ecf0f1' }}
                                                >
                                                    プロフィール
                                                </button>
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => navigate(`/home/chatStart/${uid}`)}
                                                    aria-label={`チャット開始 ${usernamesMap[uid] || uid}`}
                                                    style={{ color: '#3498db', borderColor: '#ecf0f1' }}
                                                >
                                                    チャット
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: '#7f8c8d' }}>参加者はいません。</p>
                                )}
                            </div>
                        </div>

                    );
                })
            )}
        </div>
    );
};

export default MyMatchedParticipationsOnly;
