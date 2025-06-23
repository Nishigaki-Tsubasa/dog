import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useNavigateを追加
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

const UserProfilePage = () => {
    const { uid } = useParams();
    const navigate = useNavigate(); // ナビゲート用フック
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

    if (!profile) {
        return <p className="mt-4 text-center">プロフィールが見つかりませんでした。</p>;
    }

    return (
        <div className="container mt-4">
            {/* 戻るボタン */}
            <button
                type="button"
                className="btn btn-secondary mb-3"
                onClick={() => navigate(-1)} // 1つ前のページに戻る
            >
                &larr; 戻る
            </button>

            <h2 className="mb-4">ユーザープロフィール</h2>
            <ul className="list-group">
                <li className="list-group-item">
                    <strong>ユーザー名:</strong> {profile.username || '未設定'}
                </li>
                <li className="list-group-item">
                    <strong>年齢:</strong> {profile.age ?? '未設定'}
                </li>
                <li className="list-group-item">
                    <strong>性別:</strong> {profile.gender || '未設定'}
                </li>
                <li className="list-group-item">
                    <strong>好きな食べ物:</strong>{' '}
                    {Array.isArray(profile.favoriteFoods)
                        ? profile.favoriteFoods.join(', ')
                        : '未設定'}
                </li>
                <li className="list-group-item">
                    <strong>苦手な食べ物:</strong>{' '}
                    {Array.isArray(profile.dislikedFoods)
                        ? profile.dislikedFoods.join(', ')
                        : '未設定'}
                </li>
                <li className="list-group-item">
                    <strong>自己紹介:</strong> {profile.intro || '未記入'}
                </li>
            </ul>
        </div>
    );
};

export default UserProfilePage;
