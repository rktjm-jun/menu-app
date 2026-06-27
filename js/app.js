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
