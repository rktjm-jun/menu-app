// js/api.js
const SUPABASE_URL = "https://zswsqzxbsqkdtodospnu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzd3Nxenhic3FrZHRvZG9zcG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjY5MzIsImV4cCI6MjA5ODE0MjkzMn0.8MI1OV2FwwR1ojZ1111ZZSvhplbKppkga_qlClUVnzA";

const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
};

async function fetchRecipes() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes?select=*&order=created_at.desc`, { headers });
    return res.json();
}

async function createRecipe(recipe) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(recipe),
    });
    return res.json();
}

async function fetchMealPlans(yearMonth) {
    // 例: "2026-06" の月の献立を取得
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/meal_plans?select=*,recipes(title,thumbnail_url)&date=gte.${yearMonth}-01&date=lte.${yearMonth}-31`,
        { headers }
    );
    return res.json();
}