import React, { useState } from 'react';
import { Plus, Calendar, MapPin, Users, MessageSquare } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

function MealRegistrationForm() {
    const [formData, setFormData] = useState({
        datetime: '',
        location: '',
        people: 1,
        comment: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Jitsiのルーム名をランダム生成してURLを作成する関数
    const generateRoomUrl = () => {
        const roomName = "room-" + Math.random().toString(36).substring(2, 10);
        return `https://meet.jit.si/${roomName}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'people' ? parseInt(value) || 1 : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = generateRoomUrl();  // ここでURL生成

            await addDoc(collection(db, 'meals'), {
                ...formData,
                url,  // 生成したURLを保存
                datetime: Timestamp.fromDate(new Date(formData.datetime)),
                createdAt: Timestamp.now(),
            });
            alert(`食事が登録されました！\nビデオ通話URL:\n${url}`);
            setFormData({ datetime: '', location: '', people: 1, comment: '' });
        } catch (error) {
            console.error('保存失敗:', error);
            alert('保存に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm border rounded-3">
            <div className="mb-4">
                <h2 className="h4 mb-1">食事を登録</h2>
                <p className="text-muted">一緒に食事を楽しむ仲間を見つけませんか？</p>
            </div>

            <div className="mb-3">
                <label className="form-label d-flex align-items-center gap-2">
                    <Calendar size={16} />
                    日時
                </label>
                <input
                    type="datetime-local"
                    name="datetime"
                    value={formData.datetime}
                    onChange={handleChange}
                    required
                    className="form-control"
                />
            </div>

            <div className="mb-3">
                <label className="form-label d-flex align-items-center gap-2">
                    <MapPin size={16} />
                    場所
                </label>
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="例：新宿駅周辺のカフェ"
                    className="form-control"
                />
            </div>

            <div className="mb-3">
                <label className="form-label d-flex align-items-center gap-2">
                    <Users size={16} />
                    募集人数
                </label>
                <input
                    type="number"
                    name="people"
                    value={formData.people}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    required
                    className="form-control"
                />
            </div>

            <div className="mb-4">
                <label className="form-label d-flex align-items-center gap-2">
                    <MessageSquare size={16} />
                    コメント（任意）
                </label>
                <textarea
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    rows="3"
                    className="form-control"
                    placeholder="食事の種類、雰囲気、その他お伝えしたいことがあればどうぞ..."
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className={`btn w-100 d-flex justify-content-center align-items-center gap-2 ${isSubmitting ? 'btn-secondary disabled' : 'btn-warning'}`}
            >
                <Plus size={18} />
                {isSubmitting ? '登録中...' : '食事を登録する'}
            </button>
        </form>
    );
}

export default MealRegistrationForm;
