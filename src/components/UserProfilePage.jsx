import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const UserProfilePage = () => {
    const { uid } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setProfile(docSnap.data());
            } else {
                setProfile(null);
            }
        };
        fetchProfile();
    }, [uid]);

    const genderDisplay = (gender) => {
        switch (gender) {
            case 'man':
            case 'male':
                return '男性';
            case 'woman':
            case 'female':
                return '女性';
            case 'other':
                return 'その他';
            case '':
            case null:
            case undefined:
                return '未設定';
            default:
                return gender;
        }
    };

    const formatFoodList = (foodField) => {
        if (!foodField) return '未設定';
        if (Array.isArray(foodField)) return foodField.join(', ');
        // 文字列の場合、カンマで分割してトリム
        return foodField.split(',').map(s => s.trim()).join(', ');
    };

    if (!profile) {
        return <p className="mt-5 text-center text-muted">プロフィールが見つかりませんでした。</p>;
    }

    return (
        <div className="container mt-5" style={{ maxWidth: 600 }}>
            <button
                type="button"
                className="btn btn-outline-secondary mb-4"
                onClick={() => navigate(-1)}
            >
                &larr; 戻る
            </button>

            <h2 className="mb-4 text-center" style={{ fontWeight: 'bold' }}>
                ユーザープロフィール
            </h2>

            <ul className="list-group" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                <li className="list-group-item d-flex justify-content-between">
                    <span>ユーザー名</span>
                    <span>{profile.username || '未設定'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                    <span>年齢</span>
                    <span>{profile.age ?? '未設定'}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between">
                    <span>性別</span>
                    <span>{genderDisplay(profile.gender)}</span>
                </li>
                <li className="list-group-item">
                    <strong>好きな食べ物:</strong>{' '}
                    {formatFoodList(profile.favoriteFoods)}
                </li>
                <li className="list-group-item">
                    <strong>苦手な食べ物:</strong>{' '}
                    {formatFoodList(profile.dislikedFoods)}
                </li>
                <li className="list-group-item">
                    <strong>自己紹介:</strong>
                    <p style={{ whiteSpace: 'pre-line', marginTop: '0.3rem' }}>
                        {profile.intro || '未記入'}
                    </p>
                </li>
            </ul>
        </div>
    );
};

export default UserProfilePage;
