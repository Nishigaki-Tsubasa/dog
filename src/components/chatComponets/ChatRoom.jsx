import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db, auth } from '../../firebase/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

const ChatRoom = () => {
    const { roomId } = useParams(); // URL: /chat/:roomId
    const currentUser = auth.currentUser;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

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

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!text.trim()) return;
        if (!currentUser) {
            alert('ログインが必要です');
            return;
        }

        await addDoc(collection(db, `chatRooms/${roomId}/messages`), {
            text,
            uid: currentUser.uid,
            displayName: currentUser.username || '匿名',
            timestamp: serverTimestamp(),
        });

        setText('');
    };

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2>チャットルーム</h2>
            <div style={{ height: '400px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        textAlign: msg.uid === currentUser.uid ? 'right' : 'left',
                        margin: '5px 0'
                    }}>
                        <strong>{msg.displayName}</strong><br />
                        <span>{msg.text}</span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div style={{ marginTop: '10px' }}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="メッセージを入力"
                    style={{ width: '80%', padding: '5px' }}
                />
                <button onClick={handleSend} style={{ padding: '6px 12px', marginLeft: '5px' }}>
                    送信
                </button>
            </div>
        </div>
    );
};

export default ChatRoom;
