import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase/firebase';

import Login from './pages/LoginForm.jsx';
import Register from './pages/Register';
import ProfileForm from './pages/ProfileForm';
import Home from './pages/Home';
import { AlignStart } from 'react-bootstrap-icons';

// ローディングコンポーネント
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center text-gray-500 text-lg animate-pulse">読み込み中...</div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ユーザーデータ取得
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDocFromServer(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error('ユーザーデータ取得エラー:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setIsLoading(false); // 認証 or データ取得完了後にローディング解除
    };
    fetchUserData();
  }, [user, location.pathname]);

  // リダイレクト処理
  // useEffect(() => {
  //   if (!user || userData === null || hasRedirected) return;


  //   if (!location.pathname.startsWith('/home')) {
  //     setHasRedirected(true);
  //     navigate('/home');
  //   }

  // }, [user, userData, location.pathname, hasRedirected]);

  // ローディング中なら表示
  if (isLoading) return <Loading />;

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<ProfileForm />} />
      <Route path="/home/*" element={<Home />} />
    </Routes>
  );
}

export default App;
