import React, { useEffect, useState } from "react";

const RandomJapaneseMenu = () => {
    const [menu, setMenu] = useState(null);
    const [history, setHistory] = useState([]); // 表示済みIDの履歴
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

            // 履歴にないものだけ抽出
            const filtered = data.result.filter(item => !history.includes(item.recipeId));
            let selected;
            if (filtered.length === 0) {
                // 全履歴使い切ったら履歴リセットして全件から選ぶ
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
        <div style={{ maxWidth: 400, margin: "auto", textAlign: "center" }}>
            <h1>今日のランチメニュー</h1>
            {loading && <p>読み込み中...</p>}
            {error && <p style={{ color: "red" }}>エラー: {error}</p>}
            {menu && (
                <>
                    <h2>{menu.recipeTitle}</h2>
                    <img src={menu.foodImageUrl} alt={menu.recipeTitle} style={{ width: "100%", borderRadius: 8 }} />
                    <p>投稿者: {menu.nickname}</p>
                    <a href={menu.recipeUrl} target="_blank" rel="noopener noreferrer">レシピを見る</a>
                </>
            )}
            <button onClick={fetchMenu} disabled={loading} style={{ marginTop: 20 }}>メニューを再取得</button>
        </div>
    );
};

export default RandomJapaneseMenu;
