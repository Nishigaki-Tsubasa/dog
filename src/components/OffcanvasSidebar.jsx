import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

function OffcanvasSidebar({ username, onLogout }) {
    const offcanvasRef = useRef();

    useEffect(() => {
        // BootstrapのOffcanvasインスタンスを作成
        const offcanvasElement = offcanvasRef.current;
        if (offcanvasElement && window.bootstrap) {
            const offcanvasInstance = new window.bootstrap.Offcanvas(offcanvasElement);

            // グローバル関数をセットして外部からshow()可能に
            window.showSidebar = () => {
                offcanvasInstance.show();
            };
        }
    }, []);

    // ナビリンククリック時にサイドバーを閉じる関数
    const handleLinkClick = () => {
        if (window.bootstrap) {
            const offcanvasInstance = window.bootstrap.Offcanvas.getInstance(offcanvasRef.current);
            offcanvasInstance?.hide();
        }
    };

    return (
        <div
            className="offcanvas offcanvas-start"
            tabIndex="-1"
            id="mobileSidebar"
            ref={offcanvasRef}
        >
            <div className="offcanvas-header">
                <h5 className="offcanvas-title">メニュー</h5>
                <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="offcanvas"
                    aria-label="閉じる"
                ></button>
            </div>
            <div className="offcanvas-body">
                <p className="text-muted mb-3">ログイン中: {username || '名無し'}</p>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <Link to="/home/" className="nav-link" onClick={handleLinkClick}>
                            🏠 ホーム
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/home/mealList" className="nav-link" onClick={handleLinkClick}>
                            🍽 参加申し込み
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link
                            to="/home/matchingsRequests"
                            className="nav-link"
                            onClick={handleLinkClick}
                        >
                            📌 食事リクエスト
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/home/matching" className="nav-link" onClick={handleLinkClick}>
                            🤝 マッチング済み
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/home/chat" className="nav-link" onClick={handleLinkClick}>
                            💬 チャット
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link to="/home/EditProfile" className="nav-link" onClick={handleLinkClick}>
                            ✏️ プロフィール編集
                        </Link>
                    </li>
                </ul>

                <button
                    className="btn btn-danger mt-4 w-100"
                    onClick={() => {
                        onLogout();
                        handleLinkClick();
                    }}
                >
                    ログアウト
                </button>
            </div>
        </div>
    );
}

export default OffcanvasSidebar;
