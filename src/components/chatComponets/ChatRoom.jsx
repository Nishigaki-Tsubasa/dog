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

    // メッセージ取得＆既読処理
    useEffect(() => {
        if (!roomId || !currentUser) return;

        const q = query(
            collection(db, `chatRooms/${roomId}/messages`),
            orderBy('timestamp')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const msgData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setMessages(msgData);

            // 既読処理
            snapshot.docs.forEach(async (docSnap) => {
                const msg = docSnap.data();
                const isMyMessage = msg.uid === currentUser.uid;
                const hasRead = msg.readBy?.includes(currentUser.uid);

                if (!isMyMessage && !hasRead) {
                    await updateDoc(docSnap.ref, {
                        readBy: [...(msg.readBy || []), currentUser.uid],
                    });
                }
            });
        });

        return () => unsubscribe();
    }, [roomId, currentUser]);

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

        await addDoc(collection(db, `chatRooms/${roomId}/messages`), {
            text,
            uid: currentUser.uid,
            displayName: userName,
            timestamp: serverTimestamp(),
            readBy: [currentUser.uid], // 自分は既読として記録
        });

        const roomDocRef = doc(db, 'chatRooms', roomId);
        await updateDoc(roomDocRef, {
            lastMessage: text,
            updatedAt: serverTimestamp(),
        });

        setText('');
    };

    // メッセージを日付でグループ化
    function groupMessagesByDate(messages) {
        const groups = {};

        messages.forEach((msg) => {
            if (!msg.timestamp?.seconds) return;
            const dateObj = new Date(msg.timestamp.seconds * 1000);
            const key = dateObj.toISOString().split('T')[0];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(msg);
        });

        return Object.entries(groups).sort((a, b) => (a[0] > b[0] ? 1 : -1));
    }

    function formatDateHeader(dateString) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const date = new Date(dateString);

        if (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        ) return '今日';

        if (
            date.getFullYear() === yesterday.getFullYear() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getDate() === yesterday.getDate()
        ) return '昨日';

        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div className="container-fluid d-flex flex-column vh-100 p-0 bg-light"
        >


            {/* ヘッダー */}
            <div className="bg-white shadow-sm px-4 py-3 border-bottom d-flex align-items-center" style={{ flexShrink: 0 }}>
                <button
                    className="btn btn-light border rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{ width: '40px', height: '40px' }}
                    onClick={() => navigate('/home/chat')}
                    title="戻る"
                >
                    <i className="bi bi-arrow-left-short fs-4" />
                </button>
                <h5 className="mb-0">{otherUserName || '相手ユーザー'}</h5>
            </div>

            {/* メッセージエリア */}
            <div
                className="flex-grow-1 overflow-auto px-3 py-3"
                style={{ minHeight: 0 }} // 重要：親の高さ制約内でスクロールを効かせるため
            >
                {groupedMessages.map(([dateKey, msgs]) => (
                    <div key={dateKey} className="mb-4">
                        <div className="text-center text-muted mb-3">{formatDateHeader(dateKey)}</div>
                        {msgs.map((msg) => {
                            const isMyMessage = msg.uid === currentUser?.uid;
                            const time = msg.timestamp?.toDate
                                ? msg.timestamp.toDate().toLocaleTimeString('ja-JP', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                : '';

                            return (
                                <div
                                    key={msg.id}
                                    className={`d-flex mb-2 ${isMyMessage ? 'justify-content-end' : 'justify-content-start'}`}
                                >
                                    {!isMyMessage ? (
                                        <div className="d-flex mb-2">
                                            <div className="me-2" style={{ width: '40px', flexShrink: 0 }}>
                                                <i className="bi bi-person-circle fs-3 text-secondary" />
                                            </div>
                                            <div>
                                                <div
                                                    className="rounded-4 shadow-sm bg-white text-dark px-3 py-2"
                                                    style={{
                                                        maxWidth: '60vw',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                        marginTop: '5px',
                                                    }}
                                                >
                                                    {msg.text}
                                                </div>
                                                <div className="text-muted small" style={{ fontSize: '0.7rem', marginTop: '2px', marginLeft: '8px' }}>
                                                    {time}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-end">
                                            <div
                                                className="rounded-4 shadow-sm bg-success text-white px-3 py-2"
                                                style={{
                                                    maxWidth: '60vw',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {msg.text}
                                            </div>
                                            <div className="text-muted small" style={{ fontSize: '0.7rem', marginTop: '2px', marginLeft: '4px' }}>
                                                {time}
                                            </div>
                                            <div className="text-muted small" style={{ fontSize: '0.7rem', marginLeft: '4px' }}>
                                                {msg.readBy?.length > 1 ? '既読' : '未読'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* 入力欄 */}
            <div className="bg-white px-3 py-2 border-top" style={{ flexShrink: 0 }}>
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
