import React, { useState } from 'react';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';
import { v4 as uuidv4 } from 'uuid';
import '../styles/ChatRoom.css'; // ← 追加


const generateJitsiURL = () => {
    const randomString = Math.random().toString(36).substring(2, 10);
    return `https://meet.jit.si/mealmatch-${randomString}`;
};



const MealRequestForm = () => {
    const [form, setForm] = useState({
        date: '',
        time: '',
        durationMinutes: 30,
        genre: '',
        menu: '',
        participantsLimit: '',
    });

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return alert('ログインが必要です');

        // Firestoreからユーザーのusernameを取得
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const username = userDocSnap.exists() ? userDocSnap.data().username : '匿名';

        const [year, month, day] = form.date.split('-');
        const [hour, minute] = form.time.split(':');
        const startTime = new Date(year, month - 1, day, hour, minute);

        const durationHours = Number(form.durationMinutes) / 60;
        const participantsLimit = form.participantsLimit ? Number(form.participantsLimit) : null;
        const jitsiURL = generateJitsiURL();
        const roomId = uuidv4(); // ランダムなルームIDを生成

        try {
            await addDoc(collection(db, 'mealRequests'), {
                uid: user.uid,
                username,
                startTime: Timestamp.fromDate(startTime),
                durationHours,
                format: 'online',
                location: jitsiURL,
                genre: form.genre,
                menu: form.menu,
                participantsLimit,
                createdAt: Timestamp.now(),
                participants: [],
                pendingRequests: [],
                roomId: roomId,
            });

            setForm({
                date: '',
                time: '',
                durationMinutes: 30,
                genre: '',
                menu: '',
                participantsLimit: '',
            });

            alert('食事リクエストを投稿しました！');
            window.location.href = '/home/matchingsRequests';
        } catch (error) {
            alert('投稿に失敗しました。もう一度お試しください。');
            console.error(error);
        }
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4" style={{color:'#ff6f61'}}>オンライン食事リクエスト投稿</h2>

            <form className="card p-4 shadow" 
                onSubmit={handleSubmit}
                style={{ backgroundColor: '#fdfcf7'}}
                >
                <div className="mb-3">
                    <label className="form-label">日付</label>
                    <input type="date" className="form-control" name="date" onChange={handleChange} required/>
                </div>

                <div className="mb-3">
                    <label className="form-label">開始時間</label>
                    <input type="time" className="form-control" name="time" onChange={handleChange} required/>
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
                    <small className="form-text text-muted">※ 例：30分、60分、90分など</small>
                </div>

                <div className="mb-3">
                    <label className="form-label">ジャンル（例：和食、洋食など）</label>
                    <select className="form-control" name="genre" onChange={handleChange} required>
                        <option value="">選択してください</option>
                        <option value="和食">和食</option>
                        <option value="洋食">洋食</option>
                        <option value="中華">中華</option>
                        <option value="韓国料理">韓国料理</option>
                        <option value="イタリアン">イタリアン</option>
                        <option value="フレンチ">フレンチ</option>
                        <option value="その他">その他</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">食べるもの　任意</label>
                    <input type="text" className="form-control" name="menu" onChange={handleChange} />
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
                    <small className="form-text text-muted">※ 空欄なら制限なし</small>
                </div>

                <button type="submit" className="btn Chat-btn w-100">リクエストを投稿</button>
            </form>
        </div>
    );
};

export default MealRequestForm;
