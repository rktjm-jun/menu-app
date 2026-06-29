// ------------------------------
// SPA Router with Slide Animation
// ------------------------------

const routes = [
    "#/calendar/month",
    "#/calendar/list",
    "#/meal/create",
    "#/recipe/list",
    "#/recipe/form", 
    "#/recipe/select",
    "#/family"
];

// 初期画面
let currentPage = null;

// 先頭付近に追加（showPage の上でも下でも可）
function normalizeHash(hash) {
    if (!hash) return hash;
    const q = hash.indexOf("?");
    return q === -1 ? hash : hash.slice(0, q);
}

// ページ切り替え処理
function showPage(hash) {
    // 正規化（クエリを除去）して判定に使う
    const normalized = normalizeHash(hash);

    if (!routes.includes(normalized)) {
        const def = "#/calendar/month"; // デフォルト
        // location.hash を直接書き換えると hashchange が発火するが問題ない
        location.hash = def;
        // showPage は呼び出し元の hashchange で再実行されるためここは return しておく
        return;
    }

    const targetId = normalized.replace("#/", "").replace("/", "-");
    const targetPage = document.getElementById(targetId);

    if (!targetPage) return;

    // 初回はアニメーションなし
    if (!currentPage) {
        targetPage.classList.add("active");
        currentPage = targetPage;

        runPageInit(normalized);
        return;
    }

    // 同じページなら何もしない
    if (currentPage === targetPage) return;

    // 現在のページを左へスライドアウト
    currentPage.classList.remove("active");

    // 新しいページを右からスライドイン
    targetPage.classList.add("active");

    // アニメーション終了後にクリーンアップ
    setTimeout(() => {
        currentPage.classList.remove("leave-left");
        currentPage = targetPage;

        runPageInit(normalized);
    }, 350);

    // カレンダー一覧タブに切り替わったら一覧を生成
    if (normalized === "#/calendar/list") renderCalendarList();
}

// ページ固有の初期化処理
function runPageInit(hash) {

    // 献立作成画面
    if (hash === "#/meal/create") {
        const d = sessionStorage.getItem("selectedDate");
        if (d) {
            document.getElementById("meal-date").textContent = d;
        }
    }

    // レシピ登録画面（#/recipe/form）
    if (hash === "#/recipe/form") {
        if (typeof initRecipeFormPage === "function") {
            initRecipeFormPage();
        }
    }

    // レシピ一覧画面
    if (hash === "#/recipe/list") {
        if (typeof window.initRecipeListPage === "function") {
            window.initRecipeListPage();
        } else if (typeof initRecipeListPage === "function") {
            initRecipeListPage();
        }
    }
}

// ハッシュ変更時に発火
window.addEventListener("hashchange", () => {
    showPage(location.hash);
});

// 初期表示
window.addEventListener("load", () => {
    if (!location.hash) {
        location.hash = "#/calendar/month";
    }
    showPage(location.hash);
});
