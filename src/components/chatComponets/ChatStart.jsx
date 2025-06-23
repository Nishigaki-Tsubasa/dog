import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const ChatStart = () => {
  const { userId } = useParams(); // チャット相手のユーザーID
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  console.log('StartChat component rendered with userId:', userId);

  useEffect(() => {
    const createOrGetChatRoom = async () => {
      if (!currentUser) {
        alert('ログインしてください');
        navigate('/login');
        return;
      }
      if (!userId) {
        alert('チャット相手が指定されていません', userId);
        return;
      }

      const currentUserId = currentUser.uid;

      if (userId === currentUserId) {
        alert('自分自身とチャットはできません');
        return;
      }

      // まず、自分が含まれるチャットルームを取得
      const q = query(
        collection(db, 'chatRooms'),
        where('members', 'array-contains', currentUserId)
      );
      const snapshot = await getDocs(q);

      // その中から相手も含まれるチャットルームを探す
      const existingRoomDoc = snapshot.docs.find(doc => {
        const members = doc.data().members;
        return members.includes(userId);
      });

      if (existingRoomDoc) {
        // 既存のチャットルームがあれば遷移
        navigate(`/home/chat/${existingRoomDoc.id}`);
        return;
      }

      // なければ新規作成
      const newRoomRef = await addDoc(collection(db, 'chatRooms'), {
        members: [currentUserId, userId].sort(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: '',
      });

      navigate(`/home/chat/${newRoomRef.id}`);
    };

    createOrGetChatRoom();
  }, [currentUser, userId, navigate]);

  return <p>チャットルームを作成中...</p>;
};

export default ChatStart;
