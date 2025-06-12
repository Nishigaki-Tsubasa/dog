import { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/firebase';

function Login({ setIsLoginPage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setSuccess('ログイン成功しました！');
        } catch (err) {
            setError("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。");
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("ログイン成功:", user);
        } catch (error) {
            console.error("Google ログイン失敗:", error);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
            <div className="card shadow-sm border-0 p-4 rounded-4" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="text-center mb-4 fw-bold text-success">ログイン</h2>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">メールアドレス</label>
                        <input
                            type="email"
                            className="form-control form-control-lg rounded-pill"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">パスワード</label>
                        <input
                            type="password"
                            className="form-control form-control-lg rounded-pill"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-success btn-lg mt-4 w-100 rounded-pill shadow-sm">
                        ログイン
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline-primary btn w-100 mt-3 rounded d-flex align-items-center justify-content-center shadow-sm"
                        onClick={handleGoogleLogin}
                    >
                        <img
                            src="https://developers.google.com/identity/images/g-logo.png"
                            alt="Googleロゴ"
                            style={{ width: 20, marginRight: 8 }}
                        />
                        Googleでログイン
                    </button>
                </form>

                <div className="text-center mt-4">
                    <small>
                        アカウントをお持ちでない方は{' '}
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={() => setIsLoginPage(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setIsLoginPage(false);
                                }
                            }}
                            style={{
                                color: '#0d6efd',
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
