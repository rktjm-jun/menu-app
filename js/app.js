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
// レシピ関連：Supabase 連携
// ------------------------------
import { createRecipe, getRecipes } from "./api.js";

// ------------------------------
// レシピ登録画面の初期化
// ------------------------------
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
    if (!submitBtn) return;

    // 既にリスナーが登録されている可能性を避けるため、一度削除してから登録
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

        // Supabase に送るデータ（recipes テーブル構造に合わせる）
        const recipe = {
            title,
            description: ingredients,
            instructions,
            minutes: 0,
            thumbnail_url: "",
            created_at: new Date().toISOString(),
        };
        console.log("送信データ:", recipe);

        // 送信中はボタンを無効化して二重送信を防ぐ
        newSubmitBtn.disabled = true;
        const originalText = newSubmitBtn.textContent;
        newSubmitBtn.textContent = "送信中...";

        try {
            const result = await createRecipe(recipe); // api.js 側でログと例外処理を行う

            // 成功時にフォームをクリアして一覧へ遷移
            if (Array.isArray(result) && result.length > 0) {
                const created = result[0];
                alert("レシピを登録しました！");
                titleInput.value = "";
                ingredientsInput.value = "";
                instructionsInput.value = "";

                // 可能なら作成されたレコードの id を使って遷移（なければ一覧へ）
                if (created && created.id) {
                    location.hash = `#/recipe/list`;
                } else {
                    location.hash = "#/recipe/list";
                }
            } else {
                console.error("createRecipe returned no data", result);
                alert("登録に失敗しました…");
            }
        } catch (err) {
            console.error("レシピ登録中に例外が発生しました:", err);
            alert("登録中にエラーが発生しました。コンソールのエラーを確認してください。");
        } finally {
            newSubmitBtn.disabled = false;
            newSubmitBtn.textContent = originalText;
        }
    });
}

window.initRecipeFormPage = initRecipeFormPage;

// ------------------------------
// レシピ一覧画面の初期化
// ------------------------------
function initRecipeListPage() {
    console.log("initRecipeListPage called");
    const section = document.getElementById("recipe-list");
    if (!section) return;

    // ローディング表示
    section.innerHTML = '<div class="loading">読み込み中…</div>';

    (async () => {
        const data = await getRecipes({ limit: 200, orderBy: 'created_at', order: 'desc' });
        if (data === null) {
            section.innerHTML = '<div class="error">レシピの取得に失敗しました。後でもう一度お試しください。</div>';
            return;
        }

        if (data.length === 0) {
            section.innerHTML = '<div class="empty">登録されたレシピがありません。</div>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'recipe-list-ul';

        data.forEach(r => {
            const li = document.createElement('li');
            li.className = 'recipe-item';

            const thumbHtml = r.thumbnail_url
                ? `<img src="${escapeHtml(r.thumbnail_url)}" alt="${escapeHtml(r.title)}" class="thumb">`
                : `<div class="thumb placeholder"></div>`;

            li.innerHTML = `
                <a href="#/recipe/detail/${r.id}" class="recipe-link">
                    ${thumbHtml}
                    <div class="meta">
                        <div class="title">${escapeHtml(r.title)}</div>
                        <div class="desc">${escapeHtml(r.description || '')}</div>
                    </div>
                </a>
            `;
            ul.appendChild(li);
        });

        section.innerHTML = '';
        section.appendChild(ul);
    })();
}

window.initRecipeListPage = initRecipeListPage;

// ------------------------------
// ユーティリティ
// ------------------------------
function escapeHtml(str = '') {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
