import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { getAuth } from 'firebase/auth';
import {
    FaExpand,
    FaCompress,
    FaClock,
    FaUser,
    FaUtensils,
    FaUsers,
    FaListUl,
    FaArrowLeft,
} from 'react-icons/fa';

const JitsiMeet = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const jitsiContainerRef = useRef(null);
    const [api, setApi] = useState(null);
    const [profile, setProfile] = useState(null);
    const [mealRequests, setMealRequests] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showRoomInfo, setShowRoomInfo] = useState(false); // 初期非表示
    const auth = getAuth();

    const handleBack = () => navigate(-1);

    useEffect(() => {
        const fetchProfile = async () => {
            const uid = auth.currentUser?.uid;
            if (!uid) return setProfile(null);

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

    useEffect(() => {
        if (!window.JitsiMeetExternalAPI || !profile) return;

        const domain = 'meet.jit.si';
        const options = {
            roomName: roomId,
            parentNode: jitsiContainerRef.current,
            userInfo: { displayName: profile.username || 'ゲスト' },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'hangup'],
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
            },
        };

        const _api = new window.JitsiMeetExternalAPI(domain, options);
        setApi(_api);

        return () => _api.dispose();
    }, [roomId, profile]);

    const fetchParticipantNames = async (uids) => {
        const names = await Promise.all(
            uids.map(async (uid) => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    return userDoc.exists() ? userDoc.data().username : '不明ユーザー';
                } catch {
                    return '不明ユーザー';
                }
            })
        );
        return names;
    };

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

    const roomInfo = mealRequests.length > 0 ? mealRequests[0] : null;

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            jitsiContainerRef.current?.requestFullscreen?.();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div className="container my-4">


            {/* ボタン群 */}
            {!isFullscreen && (
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <button className="btn btn-outline-secondary" onClick={handleBack}>
                        <FaArrowLeft className="me-1" /> 戻る
                    </button>

                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary" onClick={toggleFullscreen}>
                            <FaExpand className="me-1" /> 全画面
                        </button>
                        <button
                            className={`btn btn-outline-${showRoomInfo ? 'secondary' : 'success'}`}
                            onClick={() => setShowRoomInfo(prev => !prev)}
                        >
                            {showRoomInfo ? '非表示' : '情報表示'}
                        </button>
                    </div>
                </div>
            )}

            {/* メインレイアウト */}
            <div
                className={`d-flex flex-column flex-lg-row ${isFullscreen ? '' : 'gap-3'}`}
                style={{ height: isFullscreen ? '100vh' : '600px' }}
            >
                {/* Jitsiビデオ */}
                <div
                    ref={jitsiContainerRef}
                    style={{
                        flex: 7,
                        position: 'relative',
                        borderRadius: 8,
                        overflow: 'hidden',
                        height: isFullscreen ? '100vh' : '100%',
                        boxShadow: '0 0 15px rgba(0,0,0,0.2)',
                    }}
                >
                    {isFullscreen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                zIndex: 9999,
                                display: 'flex',
                                gap: '0.5rem',
                            }}
                        >
                            <button className="btn btn-warning btn-sm" onClick={toggleFullscreen}>
                                <FaCompress className="me-1" /> 全画面解除
                            </button>
                        </div>
                    )}
                </div>

                {/* ルーム情報 */}
                {!isFullscreen && showRoomInfo && (
                    <aside
                        style={{
                            flex: 3,
                            backgroundColor: '#f8f9fa',
                            borderRadius: 8,
                            padding: '1rem',
                            overflowY: 'auto',
                            minHeight: 300,
                        }}
                    >
                        <h5 className="mb-3">ルーム情報</h5>
                        {roomInfo ? (
                            <>
                                <p>
                                    <FaUtensils className="me-2 text-primary" />
                                    <strong>メニュー:</strong>{' '}
                                    {roomInfo.menu
                                        ? `${roomInfo.genre || ''}：${roomInfo.menu}`
                                        : roomInfo.genre || '不明'}
                                </p>
                                <p>
                                    <FaClock className="me-2 text-secondary" />
                                    <strong>開始時間:</strong>{' '}
                                    {roomInfo.startTime
                                        ? new Date(roomInfo.startTime.seconds * 1000).toLocaleString()
                                        : '不明'}
                                </p>
                                <p>
                                    <FaClock className="me-2 text-secondary" />
                                    <strong>所要時間:</strong>{' '}
                                    {roomInfo.participantsLimit
                                        ? `${roomInfo.participantsLimit}分`
                                        : '不明'}
                                </p>
                                <p>
                                    <FaUser className="me-2 text-secondary" />
                                    <strong>投稿者:</strong> {roomInfo.username || '不明'}
                                </p>
                                <p>
                                    <FaUsers className="me-2 text-secondary" />
                                    <strong>参加者数:</strong>{' '}
                                    {roomInfo.participantNames?.length || 0} 人
                                </p>
                                <p>
                                    <FaUsers className="me-2 text-secondary" />

                                    <strong>メンバー</strong>
                                    <br />
                                    {roomInfo.participantNames?.length > 0
                                        ? roomInfo.participantNames.map((name, index) => (
                                            <span key={index}>
                                                {name}
                                                <br />
                                            </span>
                                        ))
                                        : 'なし'}
                                </p>

                            </>
                        ) : (
                            <p className="text-muted">
                                このルームに対応する食事リクエストはありません。
                            </p>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
};

export default JitsiMeet;
