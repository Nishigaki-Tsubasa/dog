// src/WeeklyMenu.jsx
import React, { useEffect, useState } from "react";

const appId = import.meta.env.VITE_REACT_APP_RAKUTEN_APP_ID;
const affiliateId = import.meta.env.VITE_REACT_APP_RAKUTEN_AFFILIATE_ID;

const days = ["月"]; // 今日のおすすめのみ
const mealCategories = {
    朝: { categoryId: "30-310" }, // パン
    昼: { categoryId: "10-113" }, // 丼もの
    夜: { categoryId: "10-106" }  // カレー
};

const WeeklyMenu = () => {
    const [menu, setMenu] = useState({});

    useEffect(() => {
        const fetchMenu = async () => {
            const newMenu = {};
            for (const day of days) {
                newMenu[day] = {};

                for (const [mealTime, { categoryId }] of Object.entries(mealCategories)) {
                    const [parentId, childId] = categoryId.split("-");
                    const url = `https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426?format=json&applicationId=${appId}&affiliateId=${affiliateId}&categoryId=${childId}&categoryType=small&categoryParentId=${parentId}`;

                    try {
                        const res = await fetch(url);
                        if (!res.ok) {
                            console.warn(`APIエラー ${res.status}: ${res.statusText}`);
                            newMenu[day][mealTime] = null;
                            continue;
                        }
                        const data = await res.json();

                        if (!data.result || data.result.length === 0) {
                            newMenu[day][mealTime] = null;
                            continue;
                        }

                        const randomRecipe = data.result[Math.floor(Math.random() * data.result.length)];
                        newMenu[day][mealTime] = randomRecipe;
                    } catch (error) {
                        console.error("API取得エラー:", error);
                        newMenu[day][mealTime] = null;
                    }

                    // APIリクエスト間隔を2秒に延長（負荷軽減のため）
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }
            setMenu(newMenu);
        };

        fetchMenu();
    }, []);

    return (
        <div>
            <h1>🍽️ 今日のおすすめメニュー</h1>
            <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                    <tr>
                        <th>曜日</th>
                        {Object.keys(mealCategories).map((meal) => (
                            <th key={meal}>{meal}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {days.map((day) => (
                        <tr key={day}>
                            <td>{day}</td>
                            {Object.keys(mealCategories).map((meal) => {
                                const recipe = menu[day]?.[meal];
                                return (
                                    <td key={meal} style={{ textAlign: "center", verticalAlign: "top" }}>
                                        {recipe ? (
                                            <>
                                                <img
                                                    src={recipe.foodImageUrl}
                                                    alt={recipe.recipeTitle}
                                                    width="100"
                                                    style={{ borderRadius: "8px", marginBottom: "6px" }}
                                                />
                                                <br />
                                                <a href={recipe.recipeUrl} target="_blank" rel="noopener noreferrer">
                                                    {recipe.recipeTitle}
                                                </a>
                                            </>
                                        ) : (
                                            "読み込み中..."
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default WeeklyMenu;
