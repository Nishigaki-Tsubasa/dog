import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const userRef = doc(db, 'users', result.user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().firstcreated) {
                navigate('/profile');
            } else {
                navigate('/home');
            }
        } catch (err) {
            setError('ログイン失敗: メールアドレスまたはパスワードが間違っています。');
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const userRef = doc(db, 'users', result.user.uid);
            const snap = await getDoc(userRef);

            if (!snap.exists()) {
                await setDoc(userRef, {
                    uid: result.user.uid,
                    email: result.user.email,
                    displayName: result.user.displayName || '',
                    createdAt: serverTimestamp(),
                    firstcreated: true,
                });
                navigate('/profile');
            } else if (snap.data().firstcreated) {
                navigate('/profile');
            } else {
                navigate('/home');
            }
        } catch (err) {
            console.error('Googleログイン失敗:', err);
        }
    };

    return (
        // 全体
        <div className="container d-flex flex-column justify-content-center align-items-center "
            style={{
                minHeight: '100vh',
                backgroundColor: '#ffe8d9',
            }}>
            {/* アプリ名 */}
            <header className="mb-4 w-100 text-center">
                <h1
                    style={{
                        fontSize: '90px',
                        color: '#ff9e5e',
                        fontFamily: "'M PLUS Rounded 1c', sans-serif", 
                        userSelect: 'none',
                    }}
                >meeple</h1>
            </header>
            {/* ログインカード */}
            <div className="card p-4 shadow rounded-4 w-100" style={{ maxWidth: '400px' }}>
                <h2 className="text-center mb-4 fw-bold"
                    style={{
                        color: '#ff9e5e',
                        userSelect: 'none',
                    }}>ログイン</h2>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">メールアドレス</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control form-control-lg rounded-pill"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="form-label">パスワード</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control form-control-lg rounded-pill"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="d-grid">
                        <button type="submit" className="btn btn-success btn-lg rounded-pill shadow-sm"
                            style={{
                                backgroundColor: '#ff9e5e',
                                color: 'white',
                                border: 'none'
                            }}
                        >
                            ログイン
                        </button>
                    </div>
                </form>

                <div className="d-grid mt-3">
                    <button
                        type="button"
                        className="btn btn-outline-primary btn-lg rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                        onClick={handleGoogleLogin}
                    >
                        <img
                            src="https://developers.google.com/identity/images/g-logo.png"
                            alt="Googleロゴ"
                            style={{ width: 20, height: 20 }}
                        />
                        <span>Googleでログイン</span>
                    </button>
                </div>
                <div className="d-grid mt-3">
                    <small className="text-center">
                        アカウントをお持ちでない方は{' '}
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate('/register')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setIsLoginPage(true);
                                }
                            }}
                            style={{
                                color: '#ff9e5e',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                            }}
                        >
                            新規登録
                        </span>
                    </small>
                </div>


            </div>
        </div>
    );
}

export default Login;
