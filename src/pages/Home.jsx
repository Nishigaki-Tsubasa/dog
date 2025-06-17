import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';

import MealLogForm from '../components/MealLogForm';

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
                            <Link className="nav-link" to="requests">食事リクエスト一覧</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="new-request">リクエスト投稿</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="matchings">マッチング一覧</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="reminder">リマインド</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="share">食事共有</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="feedback">フィードバック</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="history">履歴・健康データ</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="settings">設定</Link>
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
                        <Route path="requests" element={<Placeholder title="食事リクエスト一覧" />} />
                        <Route path="new-request" element={<MealLogForm />} />
                        <Route path="matchings" element={<Placeholder title="マッチング一覧" />} />
                        <Route path="reminder" element={<Placeholder title="リマインド" />} />
                        <Route path="share" element={<Placeholder title="食事共有" />} />
                        <Route path="feedback" element={<Placeholder title="フィードバック" />} />
                        <Route path="history" element={<Placeholder title="履歴・健康データ" />} />
                        <Route path="settings" element={<Placeholder title="設定" />} />
                        <Route path="*" element={<Placeholder title="ホーム" />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default Home;
