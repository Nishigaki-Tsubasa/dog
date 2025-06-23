import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';

const ChatList = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [userMap, setUserMap] = useState({});
    const navigate = useNavigate();

    // 認証状態取得
    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
                setChatRooms([]);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    // チャットルーム取得
    useEffect(() => {
        if (!currentUserId) return;

        const q = query(
            collection(db, 'chatRooms'),
            where('members', 'array-contains', currentUserId),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const rooms = [];
            const userMapTemp = { ...userMap };

            for (const docSnap of snapshot.docs) {
                const room = { id: docSnap.id, ...docSnap.data() };
                const otherUid = room.members.find(uid => uid !== currentUserId);

                // 相手の名前をキャッシュ取得
                if (!userMapTemp[otherUid]) {
                    const userDoc = await getDoc(doc(db, 'users', otherUid));
                    if (userDoc.exists()) {
                        userMapTemp[otherUid] = userDoc.data().username || '相手ユーザー';
                    } else {
                        userMapTemp[otherUid] = '相手ユーザー';
                    }
                }

                room.otherUserName = userMapTemp[otherUid];
                rooms.push(room);
            }

            setUserMap(userMapTemp);
            setChatRooms(rooms);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    if (!currentUserId) return <p className="text-center mt-4">ログインしてください</p>;

    return (
        <div className="container py-3">
            <h4 className="mb-4">チャット一覧</h4>
            {chatRooms.length === 0 ? (
                <p>まだチャットはありません。</p>
            ) : (
                <ul className="list-group">
                    {chatRooms.map((room) => {
                        const isUnread = room.unread?.[currentUserId];
                        return (
                            <li
                                key={room.id}
                                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${isUnread ? 'bg-light' : ''}`}
                                onClick={() => navigate(`/home/chat/${room.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div>
                                    <strong className="d-block">{room.otherUserName}</strong>
                                    <small className="text-muted">{room.lastMessage || 'メッセージなし'}</small>
                                </div>
                                <div className="text-end">
                                    <small className="text-muted d-block">
                                        {room.updatedAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                    {isUnread && <span className="badge bg-danger mt-1">新着</span>}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default ChatList;
