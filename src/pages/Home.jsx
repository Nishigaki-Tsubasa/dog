import { auth } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (err) {
            console.error('ログアウト失敗：', err);
        }
    };

    return (
        <div className="container">
            <h2>ホーム画面</h2>
            <p>ようこそ！</p>
            <button onClick={handleLogout}>ログアウト</button>


        </div>
    );
}

export default Home;
