import React, { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    deleteDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const MyRequestsWithDetails = () => {
    const [myRequests, setMyRequests] = useState([]);
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

                const pendingUsers = await Promise.all(
                    pendingUIDs.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        return {
                            uid,
                            username: userDoc.exists() ? userDoc.data().username || '匿名' : '不明なユーザー',
                        };
                    })
                );

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

    const handleApproval = async (requestId, uid, approve) => {
        const requestRef = doc(db, 'mealRequests', requestId);

        if (approve) {
            await updateDoc(requestRef, {
                participants: arrayUnion(uid),
                pendingRequests: arrayRemove(uid),
            });
        } else {
            await updateDoc(requestRef, {
                pendingRequests: arrayRemove(uid),
            });
        }

        setMyRequests((prev) =>
            prev.map((req) => {
                if (req.id !== requestId) return req;

                const newPendingUsers = req.pendingUsers.filter((u) => u.uid !== uid);
                const newParticipants = approve
                    ? [...(req.participantUsers || []), { uid, username: '参加者' }]
                    : req.participantUsers || [];

                return {
                    ...req,
                    pendingUsers: newPendingUsers,
                    participantUsers: newParticipants,
                    pendingRequests: req.pendingRequests.filter((id) => id !== uid),
                };
            })
        );
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

    if (!user) return <p>ログインしてください</p>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                <h2 className="mb-0">登録した食事リクエスト詳細</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/home/MealRegistrationForm'}
                >
                    食事の投稿
                </button>
            </div>

            {myRequests.length === 0 && <p className="text-muted">登録したリクエストはありません。</p>}
            {myRequests.map((req) => (
                <div key={req.id} className="card mb-4 shadow-sm">
                    <div className="card-body">
                        <h5 className="card-title fw-bold mb-3">
                            {req.genre} / {req.menu}
                        </h5>

                        <dl className="row">
                            <dt className="col-sm-3">日時</dt>
                            <dd className="col-sm-9">{req.startTime.toDate().toLocaleString()}</dd>

                            <dt className="col-sm-3">所要時間</dt>
                            <dd className="col-sm-9">{req.durationHours ? `${req.durationHours}時間` : '未設定'}</dd>

                            <dt className="col-sm-3">参加者上限</dt>
                            <dd className="col-sm-9">{req.participantsLimit ? `${req.participantsLimit}人` : 'なし'}</dd>

                            <dt className="col-sm-3">場所（ビデオ通話リンク）</dt>
                            <dd className="col-sm-9">
                                {req.location ? (
                                    <a href={req.location} target="_blank" rel="noopener noreferrer" className="text-decoration-underline">
                                        リンクを開く
                                    </a>
                                ) : '未設定'}
                            </dd>

                            <dt className="col-sm-3">申請ユーザー</dt>
                            <dd className="col-sm-9">
                                {req.pendingUsers.length === 0 ? (
                                    <p className="text-muted fst-italic">申請ユーザーはいません。</p>
                                ) : (
                                    <ul className="list-unstyled mb-0">
                                        {req.pendingUsers.map((user) => (
                                            <li
                                                key={user.uid}
                                                className="d-flex align-items-center mb-2 gap-2"
                                                style={{ flexWrap: 'wrap' }}
                                            >
                                                <button
                                                    onClick={() => navigate(`/home/profile/${user.uid}`)}
                                                    className="btn btn-link p-0 text-decoration-underline flex-grow-1 text-start"
                                                    style={{ minWidth: '120px' }}
                                                >
                                                    {user.username}
                                                </button>

                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => handleApproval(req.id, user.uid, true)}
                                                >
                                                    承認
                                                </button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleApproval(req.id, user.uid, false)}
                                                >
                                                    拒否
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </dd>


                            <dt className="col-sm-3">参加済みユーザー</dt>
                            <dd className="col-sm-9">
                                {req.participantUsers.length === 0 ? (
                                    '参加者はいません。'
                                ) : (
                                    <ul className="list-unstyled mb-0">
                                        {req.participantUsers.map((user) => (
                                            <li key={user.uid}>
                                                <button
                                                    onClick={() => navigate(`/home/profile/${user.uid}`)}
                                                    className="btn btn-link p-0 text-decoration-underline text-start"
                                                >
                                                    {user.username}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </dd>
                        </dl>

                        <button className="btn btn-outline-danger mt-3" onClick={() => handleDeleteRequest(req.id)}>
                            このリクエストを削除
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MyRequestsWithDetails;
