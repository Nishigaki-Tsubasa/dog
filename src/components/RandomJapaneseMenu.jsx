import React, { useEffect, useState } from "react";

const RandomJapaneseMenu = () => {
    const [menu, setMenu] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(0);

    const APPLICATION_ID = "1098768670017652429"; // 自分のID
    const CATEGORY_ID = "10";

    const fetchMenu = async (force = false) => {
        const now = Date.now();
        if (!force && now - lastFetch < 5000) {
            setError("連続でリクエストできません。少し待ってください。");
            return;
        }
        setLastFetch(now);

        setLoading(true);
        setError(null);
        try {
            const cached = localStorage.getItem("recipes");
            let recipes;

            if (cached && !force) {
                recipes = JSON.parse(cached);
            } else {
                const res = await fetch(
                    `https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426?applicationId=${APPLICATION_ID}&categoryId=${CATEGORY_ID}`
                );
                if (!res.ok) throw new Error(`HTTPエラー: ${res.status}`);
                const data = await res.json();
                if (!data.result || data.result.length === 0) throw new Error("メニューがありません");

                recipes = data.result;
                localStorage.setItem("recipes", JSON.stringify(recipes));
            }

            const filtered = recipes.filter(item => !history.includes(item.recipeId));
            let selected;
            if (filtered.length === 0) {
                setHistory([]);
                selected = recipes[Math.floor(Math.random() * recipes.length)];
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
                <div className="col-md-8 col-lg-6">
                    <div className="text-center mb-4">
                        <h1 className="fw-bold">🍽 今日のメニュー</h1>
                        <p className="text-muted">楽天レシピからおすすめを表示します</p>
                    </div>

                    {loading && (
                        <div className="alert alert-info text-center shadow-sm rounded">
                            読み込み中...
                        </div>
                    )}
                    {error && (
                        <div className="alert alert-danger text-center shadow-sm rounded">
                            エラー: {error}
                        </div>
                    )}

                    {menu && (
                        <div className="card shadow-lg border-0 rounded-3">
                            <img
                                src={menu.foodImageUrl}
                                alt={menu.recipeTitle}
                                className="card-img-top"
                                style={{ borderRadius: "12px 12px 0 0", objectFit: "cover", maxHeight: "300px" }}
                            />
                            <div className="card-body text-center">
                                <h5 className="card-title fw-bold">{menu.recipeTitle}</h5>
                                <p className="card-text text-muted">投稿者: {menu.nickname}</p>
                                <a
                                    href={menu.recipeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary w-100 fw-bold"
                                >
                                    レシピを見る
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="d-grid mt-4">
                        <button
                            onClick={() => fetchMenu(true)}
                            disabled={loading}
                            className="btn btn-success fw-bold shadow-sm"
                        >
                            🔄 メニューを再取得
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RandomJapaneseMenu;
