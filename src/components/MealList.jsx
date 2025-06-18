import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { format } from 'date-fns';

const MealList = () => {
    const [meals, setMeals] = useState([]);

    useEffect(() => {
        const fetchMeals = async () => {
            const querySnapshot = await getDocs(collection(db, 'meals'));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMeals(data);
        };

        fetchMeals();
    }, []);

    const handleJoin = (meal) => {
        if (meal.url) {
            window.open(meal.url, '_blank', 'noopener,noreferrer');
        } else {
            alert('ビデオ通話URLが見つかりません');
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">登録された食事一覧</h2>
            {meals.map(meal => (
                <div key={meal.id} className="mb-4 p-4 border rounded shadow">
                    <p><strong>場所:</strong> {meal.location}</p>
                    <p><strong>日時:</strong> {meal.datetime?.toDate ? format(meal.datetime.toDate(), 'yyyy年M月d日 HH:mm') : ''}</p>
                    <p><strong>募集人数:</strong> {meal.people}</p>
                    <p><strong>コメント:</strong> {meal.comment || '（なし）'}</p>
                    <p><strong>登録日時:</strong> {meal.createdAt?.toDate ? format(meal.createdAt.toDate(), 'yyyy年M月d日 HH:mm:ss') : ''}</p>

                    <button
                        onClick={() => handleJoin(meal)}
                        className="mt-2 btn btn-primary"
                    >
                        参加する
                    </button>
                </div>
            ))}
        </div>
    );
};

export default MealList;
