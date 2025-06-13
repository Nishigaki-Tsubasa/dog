import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthWrapper = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                navigate('/'); // 未ログインならログインページへ
                return;
            }

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                navigate('/profile'); // ユーザーデータがなければプロフィール登録へ
                return;
            }

            const data = userDoc.data();
            if (data.firstcreated) {
                navigate('/profile'); // プロフィール未登録なら
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    if (loading) return <p>読み込み中...</p>;

    return children;
};

export default AuthWrapper;
