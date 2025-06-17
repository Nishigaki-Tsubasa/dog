import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const MealLogForm = () => {
    const [formData, setFormData] = useState({
        mealType: 'breakfast',
        description: '',
        date: '',
        time: '',
        calories: '',
        tags: ''
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const logData = {
                ...formData,
                calories: formData.calories ? parseInt(formData.calories) : null,
                timestamp: new Date(`${formData.date}T${formData.time}`),
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
                createdAt: new Date()
            };

            await addDoc(collection(db, 'mealLogs'), logData);

            alert('食事ログが保存されました！');
            setFormData({
                mealType: 'breakfast',
                description: '',
                date: '',
                time: '',
                calories: '',
                tags: ''
            });
        } catch (err) {
            console.error('保存エラー:', err);
            alert('保存に失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="mb-4">食事ログ登録</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">食事の種類</label>
                    <select className="form-select" name="mealType" value={formData.mealType} onChange={handleChange}>
                        <option value="breakfast">朝食</option>
                        <option value="lunch">昼食</option>
                        <option value="dinner">夕食</option>
                        <option value="snack">間食</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">食べた内容</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        placeholder="例：サラダ、鶏むね肉、味噌汁"
                    />
                </div>

                <div className="mb-3 row">
                    <div className="col-md-6">
                        <label className="form-label">日付</label>
                        <input
                            type="date"
                            name="date"
                            className="form-control"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">時間</label>
                        <input
                            type="time"
                            name="time"
                            className="form-control"
                            value={formData.time}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="mb-3">
                    <label className="form-label">カロリー（kcal・任意）</label>
                    <input
                        type="number"
                        name="calories"
                        className="form-control"
                        value={formData.calories}
                        onChange={handleChange}
                        placeholder="例：450"
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">タグ（カンマ区切り）</label>
                    <input
                        type="text"
                        name="tags"
                        className="form-control"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="例：高タンパク, 低糖質, 外食"
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '保存中...' : '保存する'}
                </button>
            </form>
        </div>
    );
};

export default MealLogForm;
