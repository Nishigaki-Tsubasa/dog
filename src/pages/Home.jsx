import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
import NotificationIcon from '../components/NotificationIcon';
import Notifications from '../components/Notifications';
import RandomJapaneseMenu from '../components/RandomJapaneseMenu';

import colors from '../colors';
import '../styles/Home.css';

const Placeholder = ({ title }) => (
    <div className="fs-4 text-secondary">{title}画面 - 準備中...</div>
);

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const sidebarWidthOpen = 250;
    const sidebarWidthClosed = 70;

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

    const menuItems = [
        { to: '/home/', icon: 'bi-house-door', label: 'ホーム' },
        { to: '/home/mealList', icon: 'bi-pencil-square', label: '参加申し込み' },
        { to: '/home/matchingsRequests', icon: 'bi-envelope', label: '食事リクエスト' },
        { to: '/home/matching', icon: 'bi-people', label: 'マッチング済み' },
        { to: '/home/chat', icon: 'bi-chat-dots', label: 'チャット' },
        { to: '/home/hogehoge', icon: 'bi-calendar', label: 'メニュー' },
        //{ to: '/home/EditProfile', icon: 'bi-person', label: 'プロフィール編集' },
    ];

    return (
        <div
            className="d-flex"
            style={{ minHeight: '100vh', backgroundColor: colors.mainBg, color: colors.text }}
        >
            <nav
                className="sidebar d-flex flex-column align-items-center align-items-md-start px-2 py-3 border-end"
                style={{
                    width: sidebarOpen ? sidebarWidthOpen : sidebarWidthClosed,
                    backgroundColor: colors.subBg,
                    transition: 'width 0.3s',
                }}
            >
                <div className={`d-flex w-100 mb-2 ${sidebarOpen ? 'justify-content-end' : 'justify-content-center'}`}>
                    <button
                        className="my-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <i className={`bi ${sidebarOpen ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
                    </button>
                </div>


                <div
                    className="card mb-4 w-100"
                    style={{ backgroundColor: colors.mainBg, border: 'none' }}
                >
                    {/* クリック可能なエリア */}
                    <div
                        className="card-body d-flex align-items-center"
                        onClick={() => navigate('/home/EditProfile')}
                        style={{ cursor: 'pointer' }} // マウスカーソルが手の形になる
                    >
                        <i
                            className="bi bi-person-circle fs-3 me-2"
                            style={{ color: colors.accentBg, userSelect: 'none' }}
                        ></i>
                        {sidebarOpen && (
                            <div>
                                <div className="small text-muted" style={{ userSelect: 'none' }}>ようこそ、</div>
                                <div
                                    className="fw-bold text-dark text-truncate"
                                    style={{ maxWidth: '150px', userSelect: 'none', }}
                                >
                                    {username ?? '名無し'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <ul className="nav nav-pills flex-column w-100">
                    {menuItems.map(({ to, icon, label }) => (
                        <li key={to} className="nav-item">
                            <NavLink
                                to={to}
                                end
                                className={({ isActive }) =>
                                    `nav-link sidebarLink d-flex align-items-center ${isActive ? 'active' : ''}`
                                }
                            >
                                <i className={`bi ${icon} fs-5`}></i>
                                {sidebarOpen && <span className="ms-2">{label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <button
                    onClick={handleLogout}
                    className="btn btn-danger w-100 mt-auto d-flex align-items-center justify-content-center"
                >
                    <i className="bi bi-box-arrow-right"></i>
                    {sidebarOpen && <span className="ms-2">ログアウト</span>}
                </button>
            </nav>

            <main
                className="flex-grow-1 px-3 py-4"
                style={{ transition: 'margin 0.3s' }}
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
                    <Route path="/hogehoge" element={<RandomJapaneseMenu />} />
                    <Route path="/EditProfile" element={<EditProfile />} />
                </Routes>
            </main>
        </div>
    );
}

export default Home;
