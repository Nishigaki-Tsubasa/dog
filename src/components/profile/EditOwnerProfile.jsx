import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const EditOwnerProfile = () => {
    const [formData, setFormData] = useState({ username: '', age: '', gender: '', intro: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) return;
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) setFormData(docSnap.data().owner || {});
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        await setDoc(doc(db, 'users', user.uid), { owner: formData }, { merge: true });
        alert('飼い主情報を更新しました');
    };

    if (loading) return <div>読み込み中...</div>;

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label>ユーザー名</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} className="form-control" />
            </div>
            <div className="mb-3">
                <label>年齢</label>
                <input type="number" name="age" value={formData.age} onChange={handleChange} className="form-control" />
            </div>
            <div className="mb-3">
                <label>性別</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="form-control">
                    <option value="">性別</option>
                    <option value="man">男性</option>
                    <option value="woman">女性</option>
                    <option value="other">その他</option>
                </select>
            </div>
            <div className="mb-3">
                <label>自己紹介</label>
                <textarea name="intro" value={formData.intro} onChange={handleChange} className="form-control" />
            </div>
            <button className="btn btn-primary w-100">保存</button>
        </form>
    );
};

export default EditOwnerProfile;
