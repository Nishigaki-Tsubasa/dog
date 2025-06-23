import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/firebase';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc,
} from 'firebase/firestore';

const ChatRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const currentUser = auth.currentUser;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [userName, setUserName] = useState('匿名');
    const [otherUserName, setOtherUserName] = useState('');
    const bottomRef = useRef(null);

    // 自分のユーザー名を取得
    useEffect(() => {
        const fetchUsername = async () => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    setUserName(userSnap.data().username || '匿名');
                }
            }
        };
        fetchUsername();
    }, [currentUser]);

    // 相手の名前を取得
    useEffect(() => {
        const fetchOtherUserName = async () => {
            if (!roomId || !currentUser) return;

            const roomDocRef = doc(db, 'chatRooms', roomId);
            const roomSnap = await getDoc(roomDocRef);

            if (roomSnap.exists()) {
                const members = roomSnap.data().members || [];
                const otherUid = members.find(uid => uid !== currentUser.uid);

                if (otherUid) {
                    const userDocRef = doc(db, 'users', otherUid);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        setOtherUserName(userSnap.data().username || '相手ユーザー');
                    }
                }
            }
        };

        fetchOtherUserName();
    }, [roomId, currentUser]);

    // メッセージリアルタイム取得
    useEffect(() => {
        if (!roomId) return;

        const q = query(
            collection(db, `chatRooms/${roomId}/messages`),
            orderBy('timestamp')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setMessages(msgData);
        });

        return () => unsubscribe();
    }, [roomId]);

    // スクロール下へ
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // メッセージ送信
    const handleSend = async () => {
        if (!text.trim()) return;
        if (!currentUser) {
            alert('ログインが必要です');
            return;
        }

        // メッセージ送信
        await addDoc(collection(db, `chatRooms/${roomId}/messages`), {
            text,
            uid: currentUser.uid,
            displayName: userName,
            timestamp: serverTimestamp(),
        });

        // チャットルームのlastMessageとupdatedAt更新
        const roomDocRef = doc(db, 'chatRooms', roomId);
        await updateDoc(roomDocRef, {
            lastMessage: text,
            updatedAt: serverTimestamp(),
        });

        setText('');
    };

    return (
        <div className="container-fluid vh-100 d-flex flex-column p-0 bg-light">
            {/* ヘッダー（戻るボタン付き） */}
            <div className="bg-white shadow-sm px-4 py-3 border-bottom d-flex align-items-center">
                <button className="btn btn-outline-secondary me-3" onClick={() => navigate(-1)}>
                    ← 戻る
                </button>
                <h5 className="mb-0">チャット：{otherUserName || '相手ユーザー'}</h5>
            </div>

            {/* チャットエリア */}
            <div className="flex-grow-1 overflow-auto px-3 py-3">
                {messages.map((msg) => {
                    const isMyMessage = msg.uid === currentUser?.uid;
                    return (
                        <div
                            key={msg.id}
                            className={`d-flex mb-3 ${isMyMessage ? 'justify-content-end' : 'justify-content-start'}`}
                        >
                            <div
                                className={`p-2 rounded-pill shadow-sm ${isMyMessage ? 'bg-success text-white' : 'bg-white text-dark'
                                    }`}
                                style={{ maxWidth: '70%' }}
                            >
                                {!isMyMessage && (
                                    <div className="small text-muted mb-1">{msg.displayName}</div>
                                )}
                                <div>{msg.text}</div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* 入力欄 */}
            <div className="bg-white px-3 py-2 border-top">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control rounded-pill"
                        placeholder="メッセージを入力"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="btn btn-success rounded-pill ms-2" onClick={handleSend}>
                        送信
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
