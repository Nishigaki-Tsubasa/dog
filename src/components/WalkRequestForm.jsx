import React, { useState } from 'react';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

const WalkRequestForm = () => {
    const [form, setForm] = useState({
        date: '',
        time: '',
        durationMinutes: 30,
        content: '',
        location: '',
        participantsLimit: '',
    });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
            alert('ログインが必要です');
            setLoading(false);
            return;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const username = userDocSnap.exists() ? userDocSnap.data().username : '匿名';

            const [year, month, day] = form.date.split('-');
            const [hour, minute] = form.time.split(':');
            const startTime = new Date(year, month - 1, day, hour, minute);

            const durationHours = Number(form.durationMinutes) / 60;
            const participantsLimit = form.participantsLimit ? Number(form.participantsLimit) : null;
            const roomId = uuidv4();

            await addDoc(collection(db, 'walkRequests'), {
                uid: user.uid,
                username,
                startTime: Timestamp.fromDate(startTime),
                durationHours,
                format: 'walk',
                content: form.content,
                location: form.location,
                participantsLimit,
                createdAt: Timestamp.now(),
                participants: [],
                pendingRequests: [],
                roomId: roomId,
            });

            // フォーム初期化
            setForm({
                date: '',
                time: '',
                durationMinutes: 30,
                content: '',
                location: '',
                participantsLimit: '',
            });

            // WalkList に遷移
            navigate('/home/WalkList');
        } catch (error) {
            console.error(error);
            alert('投稿に失敗しました。もう一度お試しください。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <style>{`
                /* タイトル */
                .form-title {
                    font-size: clamp(1.5rem, 4vw, 2rem);
                    text-align: center;
                    margin-bottom: 1.5rem;
                }

                /* カードフォーム */
                .walk-form {
                    background-color: #fdfcf7;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 2rem;
                    border-radius: 1rem;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    font-size: clamp(0.9rem, 2vw, 1rem);
                }

                .walk-form .form-label {
                    font-weight: 500;
                }

                .walk-form .form-text {
                    font-size: 0.85rem;
                    color: #555;
                }

                /* ボタン */
                .Walk-btn {
                    background-color: #4CAF50;
                    color: white;
                    font-weight: bold;
                    font-size: clamp(1rem, 2vw, 1.1rem);
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .Walk-btn:disabled {
                    background-color: #9cd4a3;
                    cursor: not-allowed;
                }

                .Walk-btn:hover:not(:disabled) {
                    background-color: #45a049;
                }

                /* スマホ対応 */
                @media (max-width: 576px) {
                    .walk-form {
                        padding: 1.5rem 1rem;
                    }
                }
            `}</style>

            <h2 className="form-title">散歩リクエスト投稿</h2>

            <form className="walk-form" onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">日付</label>
                    <input
                        type="date"
                        className="form-control"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">開始時間</label>
                    <input
                        type="time"
                        className="form-control"
                        name="time"
                        value={form.time}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">所要時間（分単位）</label>
                    <input
                        type="number"
                        className="form-control"
                        name="durationMinutes"
                        min="10"
                        step="10"
                        value={form.durationMinutes}
                        onChange={handleChange}
                        required
                    />
                    <small className="form-text">※ 例：30分、60分、90分など</small>
                </div>

                <div className="mb-3">
                    <label className="form-label">散歩の内容</label>
                    <input
                        type="text"
                        className="form-control"
                        name="content"
                        value={form.content}
                        onChange={handleChange}
                        placeholder="例）犬と一緒に公園を散歩"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">集合場所</label>
                    <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        placeholder="例）〇〇公園入口"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">参加人数上限</label>
                    <input
                        type="number"
                        className="form-control"
                        name="participantsLimit"
                        min="1"
                        step="1"
                        value={form.participantsLimit}
                        onChange={handleChange}
                        placeholder="例）3"
                    />
                    <small className="form-text">※ 空欄なら制限なし</small>
                </div>

                <button type="submit" className="Walk-btn w-100" disabled={loading}>
                    {loading ? '投稿中...' : 'リクエストを投稿'}
                </button>
            </form>
        </div>
    );
};

export default WalkRequestForm;
