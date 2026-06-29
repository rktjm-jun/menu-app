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

    // .finput の順番に対応
    const inputs = section.querySelectorAll(".finput");
    const titleInput = inputs[0];
    const ingredientsInput = inputs[1];
    const instructionsInput = inputs[2];

    const submitBtn = section.querySelector(".recipe-form-submit");
    if (!submitBtn) return;

    // 既存リスナーをクリアしてから登録（SPA の再初期化対策）
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
            const result = await createRecipe(recipe);

            if (Array.isArray(result) && result.length > 0) {
                alert("レシピを登録しました！");
                titleInput.value = "";
                ingredientsInput.value = "";
                instructionsInput.value = "";
                location.hash = "#/recipe/list";
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
// レシピ一覧画面の初期化（index.html の構造に合わせる）
// ------------------------------
function initRecipeListPage() {
    console.log("initRecipeListPage called");
    const section = document.getElementById("recipe-list");
    if (!section) return;

    // ローディング表示（既存 DOM を壊さないように一時的に差し替え）
    const contentContainer = document.createElement('div');
    contentContainer.id = 'recipe-list-content';
    contentContainer.innerHTML = '<div class="loading">読み込み中…</div>';

    // 既存の検索ボックスや FAB を壊さないため、section 内の rrow 等を一旦削除してから追加
    // ここでは recipe-search-box の直後にリストを挿入する想定
    const searchBox = section.querySelector('.recipe-search-box');
    if (searchBox) {
        // 既に差し込み済みなら置き換えない
        const existing = section.querySelector('#recipe-list-content');
        if (existing) existing.remove();
        searchBox.insertAdjacentElement('afterend', contentContainer);
    } else {
        // 無ければセクション末尾に追加
        section.appendChild(contentContainer);
    }

    (async () => {
        const data = await getRecipes({ limit: 200, orderBy: 'created_at', order: 'desc' });
        if (data === null) {
            contentContainer.innerHTML = '<div class="error">レシピの取得に失敗しました。後でもう一度お試しください。</div>';
            return;
        }

        if (data.length === 0) {
            contentContainer.innerHTML = '<div class="empty">登録されたレシピがありません。</div>';
            return;
        }

        // レイアウトは index.html のサンプル（.rrow）に合わせる
        const fragment = document.createDocumentFragment();

        data.forEach(r => {
            const row = document.createElement('div');
            row.className = 'rrow';

            // サムネイル領域（既存の .recipe-thumb と同様の見た目を想定）
            const thumbWrap = document.createElement('div');
            thumbWrap.className = 'recipe-thumb';
            // safe URL チェック
            const safeThumbUrl = (r.thumbnail_url && typeof r.thumbnail_url === 'string' && r.thumbnail_url.startsWith('http')) ? r.thumbnail_url : '';
            if (safeThumbUrl) {
                const img = document.createElement('img');
                img.className = 'thumb';
                img.src = safeThumbUrl;
                img.alt = r.title || '';
                img.style.width = '44px';
                img.style.height = '44px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '6px';
                thumbWrap.appendChild(img);
            } else {
                // 既存のアイコンを使う HTML と同等にするため、空の div（CSS 側でアイコン表示される想定）
                const icon = document.createElement('i');
                icon.className = 'ti ti-tools-kitchen-2';
                thumbWrap.appendChild(icon);
            }

            // テキスト領域
            const metaWrap = document.createElement('div');
            metaWrap.style.flex = '1';
            metaWrap.style.minWidth = '0';

            const titleP = document.createElement('p');
            titleP.style.margin = '0';
            titleP.style.fontSize = '14px';
            titleP.style.fontWeight = '500';
            titleP.textContent = r.title || '';

            const descP = document.createElement('p');
            descP.style.margin = '2px 0 0';
            descP.style.fontSize = '11px';
            descP.style.color = 'var(--color-text-secondary)';
            descP.textContent = (r.description || r.instructions) ? '材料・作り方あり' : '';

            metaWrap.appendChild(titleP);
            metaWrap.appendChild(descP);

            // 右矢印アイコン
            const chevron = document.createElement('i');
            chevron.className = 'ti ti-chevron-right';
            chevron.style.fontSize = '16px';
            chevron.style.color = 'var(--color-text-tertiary)';

            // クリックで詳細や選択に遷移できるようにする（例: detail ページ）
            row.addEventListener('click', () => {
                // detail ページが未実装なら一覧に留まる
                location.hash = `#/recipe/detail/${r.id || ''}`;
            });

            row.appendChild(thumbWrap);
            row.appendChild(metaWrap);
            row.appendChild(chevron);

            fragment.appendChild(row);
        });

        // 差し替え
        contentContainer.innerHTML = '';
        contentContainer.appendChild(fragment);
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
