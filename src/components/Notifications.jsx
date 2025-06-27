import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const auth = getAuth();
    const user = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'notifications'),
            where('to', '==', user.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(list);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (id) => {
        await updateDoc(doc(db, 'notifications', id), { read: true });
    };

    const markAllAsRead = async () => {
        try {
            await Promise.all(
                notifications.map(notif =>
                    updateDoc(doc(db, 'notifications', notif.id), { read: true })
                )
            );
        } catch (error) {
            console.error('一括既読更新に失敗:', error);
        }
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>通知一覧</h2>
                {notifications.length > 0 && (
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={markAllAsRead}
                    >
                        全て既読にする
                    </button>
                )}
            </div>

            {notifications.length === 0 ? (
                <p className="text-muted">新しい通知はありません</p>
            ) : (
                <ul className="list-group">
                    {notifications.map((notif) => (
                        <li
                            key={notif.id}
                            className="list-group-item d-flex justify-content-between align-items-center"
                        >
                            <span>
                                {notif.message || '新しい通知があります'}
                            </span>
                            <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                    markAsRead(notif.id);
                                    navigate(`/home/matchingsRequests`);
                                }}
                            >
                                詳細へ
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Notifications;
