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

// ページ切り替え処理
function showPage(hash) {
    if (!routes.includes(hash)) {
        hash = "#/calendar/month"; // デフォルト
        location.hash = hash;
    }

    const targetId = hash.replace("#/", "").replace("/", "-");
    const targetPage = document.getElementById(targetId);

    if (!targetPage) return;

    // 初回はアニメーションなし
    if (!currentPage) {
        targetPage.classList.add("active");
        currentPage = targetPage;

        runPageInit(hash);
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

        runPageInit(hash);
    }, 350);

    // カレンダー一覧タブに切り替わったら一覧を生成
    if (hash === "#/calendar/list") renderCalendarList();
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
