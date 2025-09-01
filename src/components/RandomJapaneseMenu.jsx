import React, { useEffect, useState } from "react";

const RandomJapaneseMenu = () => {
    const [menu, setMenu] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const APPLICATION_ID = "1098768670017652429";
    const CATEGORY_ID = "10";

    const fetchMenu = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426?applicationId=${APPLICATION_ID}&categoryId=${CATEGORY_ID}`
            );
            if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);
            const data = await res.json();
            if (!data.result || data.result.length === 0) throw new Error("メニューがありません");

            const filtered = data.result.filter(item => !history.includes(item.recipeId));
            let selected;
            if (filtered.length === 0) {
                setHistory([]);
                selected = data.result[Math.floor(Math.random() * data.result.length)];
            } else {
                selected = filtered[Math.floor(Math.random() * filtered.length)];
            }
            setMenu(selected);
            setHistory(prev => [...prev, selected.recipeId]);
        } catch (e) {
            setError(e.message);
            setMenu(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <h1 className="text-center mb-4">今日のランチメニュー</h1>

                    {loading && <div className="alert alert-info">読み込み中...</div>}
                    {error && <div className="alert alert-danger">エラー: {error}</div>}

                    {menu && (
                        <div className="card">
                            <img
                                src={menu.foodImageUrl}
                                alt={menu.recipeTitle}
                                className="card-img-top"
                                style={{ borderRadius: '8px 8px 0 0' }}
                            />
                            <div className="card-body">
                                <h5 className="card-title">{menu.recipeTitle}</h5>
                                <p className="card-text">投稿者: {menu.nickname}</p>
                                <a
                                    href={menu.recipeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                >
                                    レシピを見る
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="d-grid mt-4">
                        <button
                            onClick={fetchMenu}
                            disabled={loading}
                            className="btn btn-success"
                        >
                            メニューを再取得
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RandomJapaneseMenu;
