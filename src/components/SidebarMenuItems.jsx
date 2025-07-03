// 共通メニュー項目コンポーネント
import { Link } from 'react-router-dom';
const SidebarMenuItems = ({ onLinkClick }) => {
    return (
        <>
            <a className="nav-link" href="/home/" onClick={onLinkClick}>🏠 ホーム</a>
            <a className="nav-link" href="/home/mealList" onClick={onLinkClick}>🍽 参加申し込み</a>
            <a className="nav-link" href="/home/matchingsRequests" onClick={onLinkClick}>📌 食事リクエスト</a>
            <a className="nav-link" href="/home/matching" onClick={onLinkClick}>🤝 マッチング済み</a>
            <a className="nav-link" href="/home/chat" onClick={onLinkClick}>💬 チャット</a>
            <a className="nav-link" href="/home/EditProfile" onClick={onLinkClick}>✏️ プロフィール編集</a>
        </>
    );
};

export default SidebarMenuItems;
