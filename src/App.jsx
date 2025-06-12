import { useState } from 'react'
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import Login from './pages/Login';
import Register from './pages/Register';
import { signOut } from "firebase/auth";


function App() {
  const [user, setUser] = useState(null);
  const [isLoginPage, setIsLoginPage] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log('ログイン状態:', currentUser);
    });
    return () => unsubscribe();
  }, []);
  const handleLogout = async () => {
    try {
      await signOut(auth); // FirebaseのsignOutでログアウト
      console.log('ログアウト成功');
    } catch (err) {
      console.error('ログアウト失敗：', err.message);
    }
  };

  if (user) {
    return (
      <div className="container d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
        <div className="card shadow-sm border-0 p-4 rounded-4" style={{ width: '100%', maxWidth: '400px' }}>
          <h2 className="text-center mb-4 fw-bold text-success">ようこそ、{user.email}さん！</h2>
          <p className="text-center">ログイン状態です。</p>

          <button className="btn btn-outline-danger" onClick={handleLogout}>
            ログアウト

          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {isLoginPage ? (
        <Login setIsLoginPage={setIsLoginPage} />
      ) : (
        <Register setIsLoginPage={setIsLoginPage} />
      )}
    </div>
  );
}

export default App
