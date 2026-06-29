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
});

// ------------------------------
// レシピ登録画面：Supabase 連携
// ------------------------------
import { createRecipe } from "./api.js";

function initRecipeFormPage() {
    console.log("initRecipeFormPage called");
    const section = document.getElementById("recipe-form");
    if (!section) return;

    // あなたの HTML の .finput の順番に完全対応
    const inputs = section.querySelectorAll(".finput");
    const titleInput = inputs[0];        // 料理名
    const ingredientsInput = inputs[1];  // 材料
    const instructionsInput = inputs[2]; // 作り方

    const submitBtn = section.querySelector(".recipe-form-submit");

    // 既にリスナーが登録されている可能性を避けるため、一度削除してから登録
    // （同じページを何度も初期化する SPA の挙動対策）
    submitBtn.replaceWith(submitBtn.cloneNode(true));
    const newSubmitBtn = section.querySelector(".recipe-form-submit");

    newSubmitBtn.addEventListener("click", async () => {
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

        // B: 送信中はボタンを無効化して二重送信を防ぐ
        newSubmitBtn.disabled = true;
        const originalText = newSubmitBtn.textContent;
        newSubmitBtn.textContent = "送信中...";

        try {
            const result = await createRecipe(recipe); // A: api.js 側でログと例外処理を行う

            // C: 成功時にフォームをクリアして一覧へ遷移
            if (result && result.length > 0) {
                alert("レシピを登録しました！");
                // フォームをクリア
                titleInput.value = "";
                ingredientsInput.value = "";
                instructionsInput.value = "";
                // 一覧へ戻る
                location.hash = "#/recipe/list";
            } else {
                // createRecipe が null を返すなど失敗時
                console.error("createRecipe returned no data", result);
                alert("登録に失敗しました…");
            }
        } catch (err) {
            // 予期しない例外が発生した場合のフォールバック
            console.error("レシピ登録中に例外が発生しました:", err);
            alert("登録中にエラーが発生しました。コンソールのエラーを確認してください。");
        } finally {
            // ボタン状態を復元
            newSubmitBtn.disabled = false;
            newSubmitBtn.textContent = originalText;
        }
    });
}

window.initRecipeFormPage = initRecipeFormPage;
