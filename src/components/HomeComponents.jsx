import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import '../styles/HomeCompo.css';

const HomeComponents = () => {
    const navigate = useNavigate();
    const auth = getAuth();
    const user = auth.currentUser;

    const [currentUserData, setCurrentUserData] = useState(null);
    const [mealRequests, setMealRequests] = useState([]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // 現在ログイン中のユーザーデータ取得
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setCurrentUserData(userDoc.data());
                }

                // mealRequests コレクション取得
                const mealSnap = await getDocs(collection(db, 'mealRequests'));
                const list = [];
                const now = new Date();

                for (const docSnap of mealSnap.docs) {
                    const data = docSnap.data();
                    if (data.uid !== user.uid) {
                        let hostName = '不明';
                        const hostDoc = await getDoc(doc(db, 'users', data.uid));
                        if (hostDoc.exists()) {
                            hostName = hostDoc.data().username || '不明';
                        }

                        const startDate = data.startTime?.toDate();
                        if (startDate && startDate > now) {
                            list.push({
                                id: docSnap.id,
                                ...data,
                                hostName,
                            });
                        }
                    }
                }

                const upcomingMeals = list
                    .sort((a, b) => a.startTime.toDate() - b.startTime.toDate())
                    .slice(0, 4);

                setMealRequests(upcomingMeals);
            } catch (error) {
                console.error('データ取得エラー:', error);
            }
        };

        fetchData();
    }, [user]);

    if (!user) return <p>ログインしてください</p>;
    if (!currentUserData) return <p>読み込み中...</p>;

    return (
        <div className="container mt-4">
            {/* 挨拶セクション */}
            <div className="card shadow-sm border-0 mb-4 p-3 p-md-4 bg-light">
                <h2 className="mb-2 mb-md-3" style={{ fontSize: '1.5rem' }}>
                    こんにちは、{currentUserData.username}さん
                </h2>
                <p className="lead mb-3 mb-md-4" style={{ fontSize: '0.9rem' }}>
                    今日の食事を登録して、一緒に食べる相手を見つけましょう！
                </p>
                <button
                    className="btn Home-btn btn-lg w-100 w-md-auto"
                    style={{ fontSize: '0.9rem' }}
                    onClick={() => navigate('/home/new-request')}
                >
                    食事時間を登録
                </button>
            </div>

            {/* おすすめの食事予定 */}
            <h3 className="mb-3" style={{ fontSize: '1.2rem' }}>🍽️ おすすめ予定</h3>

            {mealRequests.length === 0 ? (
                <div className="alert alert-info" role="alert" style={{ fontSize: '0.9rem' }}>
                    現在公開されている食事予定はありません。
                </div>
            ) : (
                <div className="row">
                    {mealRequests.map((meal) => (
                        <div key={meal.id} className="col-12 col-md-6 mb-3 mb-md-4">
                            <div className="card shadow-sm h-100">
                                <div className="card-body">
                                    <h5 className="card-title" style={{ fontSize: '1rem' }}>
                                        {meal.genre} / {meal.menu}
                                    </h5>
                                    <h6 className="card-subtitle mb-2 text-muted" style={{ fontSize: '0.8rem' }}>
                                        投稿者: {meal.hostName}
                                    </h6>
                                    <hr />
                                    <p className="card-text mb-2" style={{ fontSize: '0.85rem' }}>
                                        <strong>日時:</strong>{' '}
                                        {meal.startTime.toDate().toLocaleString('ja-JP', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}<br />
                                        <strong>時間:</strong>{' '}
                                        {Math.round(meal.durationHours * 60)}分
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomeComponents;
