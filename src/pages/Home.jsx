import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

import { motion, AnimatePresence } from 'framer-motion';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';

import EditProfile from '../components/EditProfile';
import MealRegistrationForm from '../components/MealRegistrationForm';
import MealList from '../components/MealList';
import MatchingsRequests from '../components/MatchingsRequests';
import Matching from '../components/MyMatchedParticipations';
import MatchingDetail from '../components/MatchingDetail';
import HomeComponents from '../components/HomeComponents';
import UserProfilePage from '../components/UserProfilePage';
import ChatList from '../components/chatComponets/ChatList';
import ChatRoom from '../components/chatComponets/ChatRoom';
import ChatStart from '../components/chatComponets/ChatStart';
import OffcanvasSidebar from '../components/OffcanvasSidebar';
import JitsiMeet from '../components/JitsiMeet';
import Notifications from '../components/Notifications';
import SidebarMenuItems from '../components/SidebarMenuItems';

const Placeholder = ({ title }) => (
    <div className="fs-4 text-secondary">{title}画面 - 準備中...</div>
);

function Home() {
    const navigate = useNavigate();
    const [username, setUsername] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarVisible, setSidebarVisible] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const uid = user.uid;
                const userDocRef = doc(db, 'users', uid);
                try {
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        setUsername(userDocSnap.data().username || '名無し');
                    } else {
                        setUsername('名無し');
                    }
                } catch (error) {
                    console.error('ユーザー情報の取得に失敗しました:', error);
                    setUsername('名無し');
                }
            } else {
                setUsername(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (err) {
            console.error('ログアウト失敗：', err);
        }
    };

    // モバイル時の「メニューを開く」ボタンの表示制御
    useEffect(() => {
        const toggleBtn = document.getElementById('mobileMenuToggleBtn');
        const offcanvasEl = document.getElementById('mobileOffcanvas');
        if (!offcanvasEl || !toggleBtn) return;

        const handleShow = () => {
            toggleBtn.style.display = 'none';
        };

        const handleHide = () => {
            toggleBtn.style.display = 'block';
        };

        offcanvasEl.addEventListener('shown.bs.offcanvas', handleShow);
        offcanvasEl.addEventListener('hidden.bs.offcanvas', handleHide);

        return () => {
            offcanvasEl.removeEventListener('shown.bs.offcanvas', handleShow);
            offcanvasEl.removeEventListener('hidden.bs.offcanvas', handleHide);
        };
    }, []);

    return (
        <div className="container-fluid" style={{ backgroundColor: '#ffe8d9' }}>
            <div className="row min-vh-100 position-relative">
                {/* サイドバー（PC） */}
                <AnimatePresence>
                    {sidebarVisible && (
                        <motion.nav
                            initial={{ x: -250 }}
                            animate={{ x: 0 }}
                            exit={{ x: -250 }}
                            transition={{ duration: 0.3 }}
                            className="position-fixed top-0 start-0 bg-white border-end shadow-sm p-3 d-none d-md-flex flex-column"
                            style={{ width: '250px', height: '100vh', zIndex: 1040 }}
                        >
                            <div className="d-flex justify-content-end mb-3">
                                <button
                                    className="btn btn-sm btn-outline-secondary rounded-circle"
                                    onClick={() => setSidebarVisible(false)}
                                    aria-label="サイドバーを閉じる"
                                >
                                    <i className="bi bi-chevron-left" />
                                </button>
                            </div>
                            <h4 className="fw-bold mb-4 border-bottom pb-2 text-center">メニュー</h4>
                            <div className="mb-4 p-3 bg-light rounded shadow-sm d-flex align-items-center gap-3">
                                <i className="bi bi-person-circle fs-3 text-primary"></i>
                                <div className="small flex-grow-1">
                                    <div className="text-secondary">ようこそ、</div>
                                    {loading ? (
                                        <div className="text-secondary">読み込み中...</div>
                                    ) : (
                                        <div className="fw-bold text-dark">{username ?? '名無し'}</div>
                                    )}
                                </div>
                            </div>
                            <ul className="nav flex-column gap-2">
                                <SidebarMenuItems />
                            </ul>
                            <div className="mt-auto">
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-outline-danger w-100 rounded-pill mt-4"
                                >
                                    <i className="bi bi-box-arrow-right"></i> ログアウト
                                </button>
                            </div>
                        </motion.nav>
                    )}
                </AnimatePresence>

                {/* 開くボタン（PC） */}
                {!sidebarVisible && (
                    <div
                        className="d-none d-md-flex flex-column align-items-center bg-white shadow-sm position-fixed top-0 start-0 p-2"
                        style={{ width: '50px', height: '100vh', zIndex: 1030 }}
                    >
                        <button
                            className="btn btn-outline-secondary rounded-circle mb-3 d-flex align-items-center justify-content-center"
                            onClick={() => setSidebarVisible(true)}
                            aria-label="サイドバーを開く"
                            style={{ width: '38px', height: '38px' }}
                        >
                            <i className="bi bi-list fs-4" />
                        </button>
                    </div>
                )}

                {/* モバイルメニュー 開くボタン（ヘッダー固定） */}
                <div
                    id="mobileMenuToggleBtn"
                    className="d-md-none position-fixed top-0 start-0 m-2"
                    style={{ zIndex: 1100 }}
                >
                    <button
                        className="btn btn-outline-secondary rounded-circle"
                        type="button"
                        data-bs-toggle="offcanvas"
                        data-bs-target="#mobileOffcanvas"
                        aria-controls="mobileOffcanvas"
                        aria-label="メニューを開く"
                    >
                        <i className="bi bi-list fs-4" />
                    </button>
                </div>

                {/* モバイル用オフキャンバスメニュー */}
                <OffcanvasSidebar
                    id="mobileOffcanvas"
                    username={username}
                    onLogout={handleLogout}
                />

                {/* メイン */}
                <main
                    className="col px-3 px-md-4 overflow-auto"
                    style={{
                        transition: 'margin-left 0.3s ease',
                        paddingTop: 0,
                    }}
                >
                    <Routes>
                        <Route path="*" element={<HomeComponents />} />
                        <Route path="new-request" element={<MealRegistrationForm />} />
                        <Route path="mealList" element={<MealList />} />
                        <Route path="matchingsRequests" element={<MatchingsRequests />} />
                        <Route path="matching" element={<Matching />} />
                        <Route path="matching/:requestId" element={<MatchingDetail />} />
                        <Route path="profile/:uid" element={<UserProfilePage />} />
                        <Route path="chat" element={<ChatList />} />
                        <Route path="/chat/:roomId" element={<ChatRoom />} />
                        <Route path="/chatStart/:userId" element={<ChatStart />} />
                        <Route path="/jitsi/:roomId" element={<JitsiMeet />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="share" element={<Placeholder title="食事予定" />} />
                        <Route path="feedback" element={<Placeholder title="フィードバック" />} />
                        <Route path="history" element={<Placeholder title="履歴・健康データ" />} />
                        <Route path="EditProfile" element={<EditProfile />} />
                    </Routes>
                </main>
            </div>

            <style>{`
  @media (min-width: 768px) {
    main {
      margin-left: ${sidebarVisible ? '250px' : '50px'};
      margin-top: 0;
    }
  }
  @media (max-width: 767.98px) {
    main {
      margin-left: 0 !important;
      margin-top: 56px !important; /* メニューボタン分のスペース */
    }


    
  }
`}</style>

        </div >
    );
}

export default Home;
