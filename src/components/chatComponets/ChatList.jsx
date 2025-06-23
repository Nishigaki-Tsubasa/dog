import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../firebase/firebase';

const ChatList = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        const auth = getAuth();

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUserId(user.uid);
            } else {
                setCurrentUserId(null);
                setChatRooms([]); // ログアウト時はチャットリストクリアなど
            }
        });

        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!currentUserId) return; // currentUserIdがないときはFirestoreクエリしない

        const q = query(
            collection(db, 'chatRooms'),
            where('members', 'array-contains', currentUserId),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const rooms = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setChatRooms(rooms);
        });

        return () => unsubscribe();
    }, [currentUserId]);

    if (!currentUserId) {
        return <p>ログインしてください</p>;
    }

    return (
        <div>
            <h2>チャット一覧</h2>
            {chatRooms.length === 0 ? (
                <p>まだチャットはありません。</p>
            ) : (
                <ul>
                    {chatRooms.map((room) => (
                        <li key={room.id}>
                            <p>最後のメッセージ: {room.lastMessage}</p>
                            <p>更新日時: {room.updatedAt?.toDate().toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ChatList;
