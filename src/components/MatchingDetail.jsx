import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';

const MatchingDetail = () => {
    const { requestId } = useParams();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [usernames, setUsernames] = useState({});
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'mealRequests', requestId));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setRequest(data);

                    const allUids = [
                        ...(data.pendingParticipants || []),
                        ...(data.participants || []),
                        data.uid,
                    ];

                    const uniqueUids = Array.from(new Set(allUids));
                    const usernameMap = {};
                    await Promise.all(uniqueUids.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        usernameMap[uid] = userDoc.exists() ? (userDoc.data().username || '匿名') : '不明';
                    }));
                    setUsernames(usernameMap);
                } else {
                    alert('リクエストが見つかりません');
                    navigate('/home/matching');
                }
            } catch (error) {
                console.error('データ取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [requestId, navigate]);

    if (!user) return <p>ログインしてください</p>;
    if (loading) return <p>読み込み中...</p>;
    if (!request) return null;

    const isHost = user.uid === request.uid;
    const isApproved = request.participants?.includes(user.uid);
    const isPending = request.pendingParticipants?.includes(user.uid);

    const handleApprove = async (participantUid) => {
        try {
            const requestRef = doc(db, 'mealRequests', requestId);
            await updateDoc(requestRef, {
                pendingParticipants: arrayRemove(participantUid),
                participants: arrayUnion(participantUid),
            });
            const docSnap = await getDoc(requestRef);
            setRequest(docSnap.data());
        } catch (error) {
            console.error('承認エラー:', error);
        }
    };

    const handleReject = async (participantUid) => {
        try {
            const requestRef = doc(db, 'mealRequests', requestId);
            await updateDoc(requestRef, {
                pendingParticipants: arrayRemove(participantUid),
            });
            const docSnap = await getDoc(requestRef);
            setRequest(docSnap.data());
        } catch (error) {
            console.error('拒否エラー:', error);
        }
    };

    return (
        <div className="container mt-4">
            <h2>マッチング詳細</h2>
            <h4>{request.genre} / {request.menu}</h4>
            <p>日時: {request.startTime.toDate().toLocaleString()}</p>
            <p>所要時間: {Math.round(request.durationHours * 60)}分</p>
            <button
                className="btn btn-outline-primary flex-grow-1"
                onClick={() => navigate(`/home/jitsi/${req.roomId}`)}
            >
                ビデオ通話
            </button>
            <p>投稿者: {usernames[request.uid] || '匿名'}</p>


            <h5 className="mt-4">参加者一覧</h5>
            {request.participants && request.participants.length > 0 ? (
                request.participants.map(uid => (
                    <div key={uid} className="mb-1">
                        {usernames[uid] || uid}
                    </div>
                ))
            ) : (
                <p>参加者はいません。</p>
            )}



            <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>戻る</button>
        </div>
    );
};

export default MatchingDetail;
