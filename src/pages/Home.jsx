import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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


const Placeholder = ({ title }) => (
    <div className="fs-4 text-secondary">{title}画面 - 準備中...</div>
);

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="container-fluid"
            style={{
                minHeight: '100vh',
                backgroundColor: '#ffe8d9',
            }}>

            <div className="row min-vh-100">

                {/* モバイル用ハンバーガーボタン */}
                <div className="d-md-none bg-light py-2 px-3 border-bottom w-100">
                    <button
                        className="btn btn-outline-primary"
                        onClick={() => window.showSidebar()}
                    >
                        <i className="bi bi-list"></i> メニュー
                    </button>
                </div>

                {/* デスクトップ用サイドバー */}
                <nav className="col-md-3 col-lg-2 d-none d-md-block bg-white border-end shadow-sm p-3">
                    <h4 className="fw-bold mb-4 border-bottom pb-2">メニュー</h4>

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
                        {/* <NotificationIcon
                            onClick={() => {
                                // 通知一覧ページに遷移
                                navigate('/home/notifications');
                            }}
                        /> */}
                    </div>



                    <ul className="nav flex-column gap-2">
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/">🏠 ホーム</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/mealList">🍽 参加申し込み</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/matchingsRequests">📌 食事リクエスト</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/matching">🤝 マッチング済み</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/chat">💬 チャット</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/EditProfile">✏️ プロフィール編集</Link>
                        </li>
                    </ul>

                    <div className="mt-4">
                        <button
                            onClick={handleLogout}
                            className="btn btn-outline-danger w-100 rounded-pill"
                        >
                            <i className="bi bi-box-arrow-right"></i> ログアウト
                        </button>
                    </div>
                </nav>

                {/* モバイル用オフキャンバスサイドバー */}
                <div className="d-md-none">
                    <OffcanvasSidebar username={username} onLogout={handleLogout} />
                </div>

                {/* メイン表示エリア */}
                <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4" style={{ height: '100vh', paddingTop: 0 }}>


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
        </div>
    );
}

export default Home;
