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
        <div
            className="container d-flex justify-content-center align-items-center bg-light"
            style={{ minHeight: '100vh' }}
        >
            <div
                className="card shadow-sm border-0 p-4 rounded-4"
                style={{ width: '100%', maxWidth: '700px' }}
            >
                <h2 className="text-center mb-4 fw-bold text-primary">プロフィール登録</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label small">名前</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="form-control form-control-sm rounded-pill"
                            placeholder="名前"
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="age" className="form-label small">年齢</label>
                        <input
                            type="number"
                            id="age"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                            className="form-control form-control-sm rounded-pill"
                            placeholder="年齢"
                            required
                            min={0}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="gender" className="form-label small">性別</label>
                        <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="form-select form-select-sm rounded-pill"
                        >
                            <option value="man">男性</option>
                            <option value="woman">女性</option>
                            <option value="other">その他</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="favoriteFoods" className="form-label small">好きな料理 (カンマ区切り)</label>
                        <input
                            type="text"
                            id="favoriteFoods"
                            name="favoriteFoods"
                            value={formData.favoriteFoods}
                            onChange={handleChange}
                            className="form-control form-control-sm rounded-pill"
                            placeholder="例：寿司, カレー, ピザ"
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="dislikedFoods" className="form-label small">苦手な料理 (カンマ区切り)</label>
                        <input
                            type="text"
                            id="dislikedFoods"
                            name="dislikedFoods"
                            value={formData.dislikedFoods}
                            onChange={handleChange}
                            className="form-control form-control-sm rounded-pill"
                            placeholder="例：納豆, パクチー"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="intro" className="form-label small">自己紹介</label>
                        <textarea
                            id="intro"
                            name="intro"
                            value={formData.intro}
                            onChange={handleChange}
                            className="form-control form-control-sm rounded-4"
                            rows={2}
                            placeholder="自己紹介を書いてください"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm">
                        保存する
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ProfileForm;
