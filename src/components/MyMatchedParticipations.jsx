import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { Rewind } from 'lucide-react';

const MyMatchedParticipationsOnly = () => {
    const [participantList, setParticipantList] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const fetchParticipantRequests = async () => {
            setLoading(true);

            // 自分が参加者として承認されたリクエストのみ取得
            const q = query(collection(db, 'mealRequests'), where('participants', 'array-contains', user.uid));
            const snapshot = await getDocs(q);
            const participantRequests = [];

            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();

                // ホスト名を取得
                let hostName = '匿名';
                if (data.uid) {
                    const hostDoc = await getDoc(doc(db, 'users', data.uid));
                    hostName = hostDoc.exists() ? (hostDoc.data().username || '匿名') : '不明';
                }
                participantRequests.push({
                    id: docSnap.id,
                    ...data,
                    hostName,
                });
            }

            setParticipantList(participantRequests);
            setLoading(false);
        };

        fetchParticipantRequests();
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
                                {/* <strong>通話URL:</strong>{' '}
                                <a href={req.location} target="_blank" rel="noopener noreferrer">
                                    {req.location}
                                </a> */}
                            </p>

                            <div className="d-flex gap-2 mb-3">
                                <a
                                    href={req.location}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary flex-grow-1"
                                    style={{ textDecoration: 'none' }}
                                >
                                    通話
                                </a>

                                <button
                                    className="btn btn-outline-primary flex-grow-1"
                                    onClick={() => {
                                        console.log(req.uid);
                                        navigate(`/home/chatStart/${req.uid}`);
                                    }}
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
        </div >
    );
};

export default MyMatchedParticipationsOnly;
