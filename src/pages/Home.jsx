import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';

import MealLogForm from '../components/MealLogForm';
import EditProfile from '../components/EditProfile';

const Placeholder = ({ title }) => (
    <div className="fs-4 text-secondary">{title}画面 - 準備中...</div>
);

function Home() {
    const navigate = useNavigate();

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
                    <h4 className="fw-bold mb-4">ホームメニュー</h4>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/">ホーム</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/new-request">食事の登録</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/home/matchings">マッチング一覧</Link>
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
                        <Route path="new-request" element={<MealLogForm />} />
                        <Route path="matchings" element={<Placeholder title="マッチング一覧" />} />
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
