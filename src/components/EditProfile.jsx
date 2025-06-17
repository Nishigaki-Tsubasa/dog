import React, { useState, useEffect } from 'react';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebase';

const EditProfile = () => {
    const [formData, setFormData] = useState({
        username: '',
        age: '',
        gender: 'man',
        favoriteFoods: '',
        dislikedFoods: '',
        intro: '',
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;
                if (!user) {
                    console.error('ログインユーザーが見つかりません');
                    return;
                }
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setFormData(docSnap.data());
                } else {
                    console.log('プロフィールデータが存在しません');
                }
            } catch (error) {
                console.error('データ取得エラー:', error);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) {
                console.error('ログインユーザーが見つかりません');
                return;
            }
            await setDoc(doc(db, 'users', user.uid), formData);
            alert('プロフィールが更新されました');
        } catch (error) {
            console.error('保存エラー:', error);
        }
    };

    return (
        <div className="container mt-5">
            <div className="card p-4 shadow">
                <h2 className="card-title mb-4">プロフィール編集</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">ユーザー名</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">年齢</label>
                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">性別</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="form-control"
                        >
                            <option value="man">男性</option>
                            <option value="woman">女性</option>
                            <option value="other">その他</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">好きな食べ物 (カンマ区切り)</label>
                        <input
                            type="text"
                            name="favoriteFoods"
                            value={formData.favoriteFoods}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">苦手な食べ物 (カンマ区切り)</label>
                        <input
                            type="text"
                            name="dislikedFoods"
                            value={formData.dislikedFoods}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">自己紹介</label>
                        <textarea
                            name="intro"
                            rows={4}
                            value={formData.intro}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-100">
                        保存する
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;
