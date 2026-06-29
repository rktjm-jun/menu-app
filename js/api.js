// js/api.js
const SUPABASE_URL = "https://zswsqzxbsqkdtodospnu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzd3Nxenhic3FrZHRvZG9zcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjY5MzIsImV4cCI6MjA5ODE0MjkzMn0.8MI1OV2FwwR1ojZ1111ZZSvhplbKppkga_qlClUVnzA";

// 共通ヘッダー
const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
};

/* -----------------------------
   レシピ（recipes）
----------------------------- */

// レシピ一覧（新しい順）
export async function fetchRecipes() {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/recipes?select=*&order=created_at.desc`,
        { headers }
    );
    return res.json();
}

// レシピ登録
export async function createRecipe(recipe) {
    try {
        console.log("createRecipe 呼び出し:", recipe);

        const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
            method: "POST",
            headers: { ...headers, Prefer: "return=representation" },
            body: JSON.stringify(recipe),
        });

        console.log("HTTP status:", res.status, res.statusText);

        // レスポンスが JSON でない場合に備えて try/catch
        let data = null;
        try {
            data = await res.json();
        } catch (e) {
            console.warn("レスポンス JSON のパースに失敗しました", e);
        }
        console.log("レスポンス JSON:", data);

        if (!res.ok) {
            console.error("Supabase エラー:", res.status, data);
            // 呼び出し元で失敗を判定しやすいよう null を返す
            return null;
        }

        return data;
    } catch (err) {
        console.error("createRecipe 例外:", err);
        // 呼び出し元で catch できるよう例外を投げるか null を返す選択があるが、
        // app.js 側で try/catch しているのでここでは例外を再スローする
        throw err;
    }
}

// レシピ一覧画面に登録したレシピを表示する
export async function getRecipes({ limit = 100, orderBy = 'created_at', order = 'desc' } = {}) {
    try {
        console.log("getRecipes 呼び出し: limit=", limit, "orderBy=", orderBy, "order=", order);
        const url = new URL(`${SUPABASE_URL}/rest/v1/recipes`);
        // クエリ例: ?select=*&order=created_at.desc&limit=100
        url.searchParams.set('select', '*');
        url.searchParams.set('order', `${orderBy}.${order}`);
        url.searchParams.set('limit', String(limit));

        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: headers, // 既存の headers を利用 (apikey, Authorization, Content-Type 等)
        });

        console.log("getRecipes HTTP status:", res.status);
        if (!res.ok) {
            const err = await res.text().catch(() => null);
            console.error("getRecipes エラー:", res.status, err);
            return null;
        }

        const data = await res.json().catch(() => null);
        console.log("getRecipes レスポンス:", data);
        return Array.isArray(data) ? data : [];
    } catch (err) {
        console.error("getRecipes 例外:", err);
        return null;
    }
}



/* -----------------------------
   献立（meal_plans）
----------------------------- */

// 月の献立一覧（JOIN 付き）
export async function fetchMealPlans(yearMonth) {
    // 例: "2026-06" の月の献立を取得
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/meal_plans?select=*,recipes(title,thumbnail_url)&date=gte.${yearMonth}-01&date=lte.${yearMonth}-31`,
        { headers }
    );
    return res.json();
}