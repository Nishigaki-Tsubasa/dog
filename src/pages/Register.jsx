import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';

function Register({ setIsLoginPage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            await setDoc(doc(db, 'users', uid), {
                email,
                createdAt: serverTimestamp(),
                role: 'user',
                firstcreated: true,
            });

            setSuccess('登録に成功しました！');
            setEmail('');
            setPassword('');
        } catch (err) {
            setError('登録に失敗しました: ' + err.message);
        }
    };

    return (
        <div className="container d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
            <div className="card shadow-sm border-0 p-4 rounded-4" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="text-center mb-4 fw-bold text-primary">新規登録</h2>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleRegister}>
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

                    <div className="mb-4">
                        <label className="form-label">パスワード</label>
                        <input
                            type="password"
                            className="form-control form-control-lg rounded-pill"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-100 rounded-pill shadow-sm">
                        登録する
                    </button>
                </form>

                <div className="text-center mt-4">
                    <small>
                        すでにアカウントをお持ちの方は{' '}
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate('/')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setIsLoginPage(true);
                                }
                            }}
                            style={{
                                color: '#0d6efd',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                            }}
                        >
                            ログイン
                        </span>
                    </small>
                </div>
            </div>
        </div>
    );
}

export default Register;
