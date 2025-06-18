import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';  // dbはFirestoreインスタンス
import { doc, getDoc } from 'firebase/firestore';

import EditProfile from '../components/EditProfile';
import MealRegistrationForm from '../components/MealRegistrationForm';
import MealList from '../components/MealList';

const Placeholder = ({ title }) => (
    <div className="fs-4 text-secondary">{title}画面 - 準備中...</div>
);

function Home() {
    const navigate = useNavigate();
    const [username, setUsername] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsername = async () => {
            if (!auth.currentUser) {
                setLoading(false);
                return;
            }

            const uid = auth.currentUser.uid;
            const userDocRef = doc(db, 'users', uid);

            try {
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    setUsername(data.username || '名無し');
                } else {
                    setUsername('名無し');
                }
            } catch (error) {
                console.error('ユーザー情報の取得に失敗しました:', error);
                setUsername('名無し');
            } finally {
                setLoading(false);
            }
        };

        fetchUsername();


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
        <div className="container-fluid">
            <div className="row min-vh-100">
                {/* サイドバー */}
                <nav className="col-md-3 col-lg-2 d-md-block bg-light sidebar p-3">
                    <h4 className="fw-bold mb-2">ホームメニュー</h4>

                    {/* Firestoreから取得したusername表示 */}
                    <div className="mb-4">
                        <strong>ログイン中:</strong>
                        {loading ? (
                            <span className="text-muted">読み込み中...</span>
                        ) : (
                            <span>{username}</span>
                        )}
                    </div>

                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/">ホーム</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/new-request">食事の登録</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/matchings">食事一覧</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/chat">チャット</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/share">食事予定</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/feedback">フィードバック</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/history">履歴・健康データ</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/EditProfile">プロフィール編集</Link>
                        </li>
                        <li className="nav-item mt-3">
                            <button onClick={handleLogout} className="btn btn-outline-danger w-100">
                                ログアウト
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* メイン表示部分 */}
                <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 pt-4">
                    <Routes>
                        <Route path="*" element={<Placeholder title="ホーム" />} />
                        <Route path="new-request" element={<MealRegistrationForm />} />
                        <Route path="matchings" element={<MealList />} />
                        <Route path="chat" element={<Placeholder title="チャット" />} />
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
