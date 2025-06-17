import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase/firebase';

import Login from './pages/Login';
import Register from './pages/Register';
import ProfileForm from './pages/ProfileForm';
import Home from './pages/Home';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // location.pathnameも依存配列に入れて、ページ遷移時に最新のuserDataを取得
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDocFromServer(docRef); // サーバーから最新データを取得
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
    };
    fetchUserData();
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user || userData === null || hasRedirected) return;

    if (userData.firstcreated) {
      if (location.pathname !== '/profile') {
        setHasRedirected(true);
        navigate('/profile');
      }
    } else {
      if (!location.pathname.startsWith('/home')) {
        setHasRedirected(true);
        navigate('/home');
      }
    }
  }, [user, userData, location.pathname, hasRedirected]);



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
