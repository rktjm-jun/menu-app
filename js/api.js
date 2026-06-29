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