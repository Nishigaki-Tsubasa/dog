import React, { useState } from 'react';
import { Plus, Calendar, MapPin, Users, MessageSquare } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

import { db } from '../firebase/firebase'; // Firebaseの初期化と設定を行ったファイルをインポート

function MealRegistrationForm() {
    const [formData, setFormData] = useState({
        datetime: '',
        location: '',
        people: 1,
        comment: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

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
            await addDoc(collection(db, 'meals'), {
                ...formData,
                datetime: Timestamp.fromDate(new Date(formData.datetime)),
                createdAt: Timestamp.now(),
            });
            alert('食事が登録されました！');
            setFormData({ datetime: '', location: '', people: 1, comment: '' });
        } catch (error) {
            console.error('保存失敗:', error);
            alert('保存に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">食事を登録</h2>
                <p className="text-gray-600">一緒に食事を楽しむ仲間を見つけませんか？</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>日時</span>
                    </label>
                    <input
                        type="datetime-local"
                        name="datetime"
                        value={formData.datetime}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>場所</span>
                    </label>
                    <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="例：新宿駅周辺のカフェ"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <Users className="w-4 h-4" />
                        <span>募集人数</span>
                    </label>
                    <input
                        type="number"
                        name="people"
                        value={formData.people}
                        onChange={handleChange}
                        min="1"
                        max="20"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>コメント（任意）</span>
                    </label>
                    <textarea
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        rows="3"
                        placeholder="食事の種類、雰囲気、その他お伝えしたいことがあればどうぞ..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center space-x-2 ${isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg transform hover:-translate-y-0.5'
                        }`}
                >
                    <Plus className="w-5 h-5" />
                    <span>{isSubmitting ? '登録中...' : '食事を登録する'}</span>
                </button>
            </div>
        </form>
    );
}


export default MealRegistrationForm;
