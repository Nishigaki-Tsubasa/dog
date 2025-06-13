import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

function ProfileForm() {
    const [formData, setFormData] = useState({
        username: '',
        age: '',
        gender: 'man',
        favoriteFoods: '',
        dislikedFoods: '',
        intro: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        await setDoc(doc(db, 'users', uid), {
            ...formData,
            age: parseInt(formData.age),
            favoriteFoods: formData.favoriteFoods.split(',').map(s => s.trim()),
            dislikedFoods: formData.dislikedFoods.split(',').map(s => s.trim()),
            createdAt: serverTimestamp(),
            firstcreated: false,
        }, { merge: true });

        navigate('/home');
    };

    return (
        <div className="container">
            <h2>プロフィール登録</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="名前" required />
                <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="年齢" required />
                <select name="gender" value={formData.gender} onChange={handleChange}>
                    <option value="man">男性</option>
                    <option value="woman">女性</option>
                    <option value="other">その他</option>
                </select>
                <input type="text" name="favoriteFoods" value={formData.favoriteFoods} onChange={handleChange} placeholder="好きな料理 (カンマ区切り)" />
                <input type="text" name="dislikedFoods" value={formData.dislikedFoods} onChange={handleChange} placeholder="苦手な料理 (カンマ区切り)" />
                <textarea name="intro" value={formData.intro} onChange={handleChange} placeholder="自己紹介" />
                <button type="submit">保存する</button>
            </form>
        </div>
    );
}

export default ProfileForm;
