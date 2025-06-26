import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';

const JitsiMeet = () => {
    const { roomId } = useParams();
    const navigate = useNavigate(); // 追加
    const jitsiContainerRef = useRef(null);
    const [api, setApi] = useState(null);
    const [profile, setProfile] = useState(null);
    const [mealRequests, setMealRequests] = useState([]);

    const auth = getAuth();

    // 戻るボタンのハンドラ
    const handleBack = () => {
        navigate(-1);
    };

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
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone',
                    'camera',
                    'chat',
                    'hangup'
                ],
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                DEFAULT_REMOTE_DISPLAY_NAME: '参加者',
                TOOLBAR_ALWAYS_VISIBLE: true,
                APP_NAME: 'MealMatch',
                SHOW_CHROME_EXTENSION_BANNER: false,
                DISABLE_VIDEO_BACKGROUND: true,
            },
            configOverwrite: {
                disableDeepLinking: true,
                enableWelcomePage: false,
                prejoinPageEnabled: true,
                startWithAudioMuted: true,
                startWithVideoMuted: false,
                defaultLanguage: 'ja',
                disableInviteFunctions: true,
            }
        };

        const _api = new window.JitsiMeetExternalAPI(domain, options);
        setApi(_api);

        return () => _api.dispose();
    }, [roomId, profile]);

    // UID配列から名前配列を取得
    const fetchParticipantNames = async (uids) => {
        const names = await Promise.all(
            uids.map(async (uid) => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    return userDoc.exists() ? userDoc.data().username : '不明ユーザー';
                } catch (e) {
                    console.error('ユーザー情報取得失敗:', uid, e);
                    return '不明ユーザー';
                }
            })
        );
        return names;
    };

    // mealRequests取得（roomIdでフィルタリング）
    useEffect(() => {
        const fetchMealRequests = async () => {
            try {
                const q = query(collection(db, 'mealRequests'), where('roomId', '==', roomId));
                const querySnapshot = await getDocs(q);

                const mealsWithNames = await Promise.all(
                    querySnapshot.docs.map(async (docSnap) => {
                        const data = docSnap.data();
                        const participants = data.participants || [];
                        const participantNames = await fetchParticipantNames(participants);

                        return {
                            id: docSnap.id,
                            ...data,
                            participantNames,
                        };
                    })
                );

                setMealRequests(mealsWithNames);
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
            <button className="btn btn-secondary mb-3" onClick={handleBack}>
                ← 戻る
            </button>
            <h2 className="mb-4">Jitsi Meetルームでビデオ通話</h2>
            <div className="mb-3" ref={jitsiContainerRef} style={{ height: '500px', width: '100%' }} />
            <section>
                {mealRequests.length === 0 ? (
                    <p className="text-muted">このルームに対応する食事リクエストはありません。{roomId}</p>
                ) : (
                    <ul className="list-group">
                        {mealRequests.map((meal) => (
                            <li key={meal.id} className="list-group-item mb-2">
                                <p><strong>開始時間:</strong> {meal.startTime ? new Date(meal.startTime.seconds * 1000).toLocaleString() : '不明'}</p>
                                <p><strong>所要時間:</strong> {meal.participantsLimit + "分" || '不明'}</p>
                                <p><strong>ホスト:</strong> {meal.username || '不明'}</p>
                                <p><strong>メニュー:</strong> {meal.menu ? `${meal.genre || ''}：${meal.menu}` : meal.genre || '不明'}</p>
                                <p><strong>参加者数:</strong> {meal.participantNames?.length + '人' || '未定'}</p>
                                <p><strong>メンバー:</strong> {
                                    meal.participantNames?.length > 0
                                        ? meal.participantNames.join('、')
                                        : 'なし'
                                }</p>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default JitsiMeet;
