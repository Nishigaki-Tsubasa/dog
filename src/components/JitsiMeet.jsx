import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';

const JitsiMeet = () => {
    const { roomId } = useParams();
    const jitsiContainerRef = useRef(null);
    const [api, setApi] = useState(null);
    const [profile, setProfile] = useState(null);
    const [mealRequests, setMealRequests] = useState([]);

    const auth = getAuth();

    // ユーザープロフィール取得
    useEffect(() => {
        const fetchProfile = async () => {
            const uid = auth.currentUser?.uid;
            if (!uid) {
                setProfile(null);
                return;
            }
            try {
                const docRef = doc(db, 'users', uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile(docSnap.data());
                } else {
                    setProfile(null);
                }
            } catch (error) {
                console.error('プロフィール取得エラー:', error);
            }
        };
        fetchProfile();
    }, [auth.currentUser]);

    // JitsiMeet初期化
    useEffect(() => {
        if (!window.JitsiMeetExternalAPI) return;
        if (!profile) return;

        const domain = 'meet.jit.si';
        const options = {
            roomName: roomId,
            parentNode: jitsiContainerRef.current,
            userInfo: { displayName: profile.username || 'ゲスト' },
        };

        const _api = new window.JitsiMeetExternalAPI(domain, options);
        setApi(_api);

        return () => _api.dispose();
    }, [roomId, profile]);

    // mealRequests取得（roomIdでフィルタリング）
    useEffect(() => {
        const fetchMealRequests = async () => {
            try {
                const q = query(collection(db, 'mealRequests'), where('roomId', '==', roomId));
                const querySnapshot = await getDocs(q);

                const meals = [];
                querySnapshot.forEach((doc) => {
                    meals.push({ id: doc.id, ...doc.data() });
                });

                setMealRequests(meals);
            } catch (error) {
                console.error('mealRequests取得エラー:', error);
            }
        };

        fetchMealRequests();
    }, [roomId]);

    // 音声ミュート切替
    const toggleAudio = () => {
        api?.executeCommand('toggleAudio');
    };

    // 退出
    const hangup = () => {
        api?.executeCommand('hangup');
    };

    return (
        <div className="container my-4">
            <section>
                {/* <h2 className="mb-3">食事リクエスト（ルーム: {roomId}）</h2> */}

                {mealRequests.length === 0 ? (
                    <p className="text-muted">このルームに対応する食事リクエストはありません。{roomId}</p>
                ) : (
                    <ul className="list-group">
                        {mealRequests.map((meal) => (
                            <li key={meal.id} className="list-group-item mb-2">
                                <p><strong>日時:</strong> {meal.startTime ? new Date(meal.startTime.seconds * 1000).toLocaleString() : '不明'}</p>
                                <p><strong>メニュー:</strong> {meal.menu ? `${meal.genre || ''}：${meal.menu}` : meal.genre || '不明'}</p>
                                <p><strong>備考:</strong> {meal.notes || 'なし'}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            <div className="mb-3" ref={jitsiContainerRef} style={{ height: '500px', width: '100%' }} />

        </div>
    );
};

export default JitsiMeet;
