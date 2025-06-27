import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';

const MyMatchedParticipationsOnly = () => {
    const [participantList, setParticipantList] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const fetchRequests = async () => {
            setLoading(true);
            const allRequests = [];

            // ① 自分が参加者のリクエスト
            const q1 = query(collection(db, 'mealRequests'), where('participants', 'array-contains', user.uid));
            const snapshot1 = await getDocs(q1);
            for (const docSnap of snapshot1.docs) {
                const data = docSnap.data();
                let hostName = '匿名';
                if (data.uid) {
                    const hostDoc = await getDoc(doc(db, 'users', data.uid));
                    hostName = hostDoc.exists() ? (hostDoc.data().username || '匿名') : '不明';
                }
                allRequests.push({
                    id: docSnap.id,
                    ...data,
                    hostName,
                    isHost: false,
                });
            }

            // ② 自分がホストで、参加者が1人以上いるリクエスト
            const q2 = query(collection(db, 'mealRequests'), where('uid', '==', user.uid));
            const snapshot2 = await getDocs(q2);
            for (const docSnap of snapshot2.docs) {
                const data = docSnap.data();
                if (data.participants && data.participants.length > 0) {
                    allRequests.push({
                        id: docSnap.id,
                        ...data,
                        hostName: user.username || '自分',
                        isHost: true,
                    });
                }
            }

            // 重複排除（同じリクエストにホストと参加者両方で該当した場合）
            const uniqueRequests = Object.values(
                allRequests.reduce((acc, item) => {
                    acc[item.id] = item;
                    return acc;
                }, {})
            );

            setParticipantList(uniqueRequests);
            setLoading(false);
        };

        fetchRequests();
    }, [user]);

    if (!user) return <p className="text-center mt-4">ログインしてください</p>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4 border-bottom">マッチングした食事の一覧</h2>

            {loading ? (
                <div className="text-muted">読み込み中...</div>
            ) : participantList.length === 0 ? (
                <p className="text-muted">マッチングした食事はありません</p>
            ) : (
                participantList.map((req) => (
                    <div key={req.id} className="card mb-3 shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title">{req.genre} / {req.menu}</h5>
                            <p className="card-text">
                                <strong>投稿者:</strong> {req.hostName}<br />
                                <strong>日時:</strong> {req.startTime.toDate().toLocaleString()}（{Math.round(req.durationHours * 60)}分）<br />
                            </p>

                            <div className="d-flex gap-2 mb-3">
                                {/* <a
                                    href={req.location}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary flex-grow-1"
                                    style={{ textDecoration: 'none' }}
                                >
                                    URLを開く
                                </a> */}

                                <button
                                    className="btn btn-outline-primary flex-grow-1"
                                    onClick={() => navigate(`/home/jitsi/${req.roomId}`)}
                                >
                                    ビデオ通話
                                </button>

                                <button
                                    className="btn btn-outline-primary flex-grow-1"
                                    onClick={() => navigate(`/home/chatStart/${req.uid}`)}
                                >
                                    チャット
                                </button>


                            </div>

                            <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => navigate(`/home/matching/${req.id}`)}
                            >
                                詳細を見る
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default MyMatchedParticipationsOnly;
