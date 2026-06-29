// ------------------------------
// 献立作成画面：閉じる処理
// ------------------------------
function closeMealCreate() {
    location.hash = "#/calendar/month";
}

// ------------------------------
// 献立作成画面：日付の読み込み
// ------------------------------
window.addEventListener("hashchange", () => {
    if (location.hash === "#/meal/create") {
        const d = sessionStorage.getItem("selectedDate");
        if (d) {
            document.getElementById("meal-date").textContent = d;
        }
    }

    // レシピ登録画面に入ったら初期化
    if (location.hash === "#/recipe/create") {
        initRecipeFormPage();
    }
});

// ------------------------------
// レシピ登録画面：Supabase 連携
// ------------------------------
import { createRecipe } from "./api.js";

function initRecipeFormPage() {
    const section = document.getElementById("recipe-form");
    if (!section) return;

    // あなたの HTML の .finput の順番に完全対応
    const inputs = section.querySelectorAll(".finput");
    const titleInput = inputs[0];        // 料理名
    const ingredientsInput = inputs[1];  // 材料
    const instructionsInput = inputs[2]; // 作り方

    const submitBtn = section.querySelector(".recipe-form-submit");

    submitBtn.addEventListener("click", async () => {
        console.log("保存ボタンが押されました");
        const title = titleInput.value.trim();
        const ingredients = ingredientsInput.value.trim();
        const instructions = instructionsInput.value.trim();

        if (!title) {
            alert("料理名は必須です");
            return;
        }

        // Supabase に送るデータ（あなたの recipes テーブル構造に合わせている）
        const recipe = {
            title,
            description: ingredients,     // 材料 → description に保存（あなたの既存仕様）
            instructions,
            minutes: 0,                   // 任意項目なので 0（必要なら変更）
            thumbnail_url: "",            // 写真は後で Supabase Storage と連携
            created_at: new Date().toISOString(),
        };
        console.log("送信データ:", recipe); 

        const result = await createRecipe(recipe);

        if (result && result.length > 0) {
            alert("レシピを登録しました！");
            location.hash = "#/recipe/list";  // 一覧へ戻る
        } else {
            alert("登録に失敗しました…");
        }
    });
}
