// ------------------------------
// 月間カレンダー（前月・次月の補完日つき）
// ------------------------------

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0 = Jan

function renderCalendar() {
    const container = document.getElementById("calendar-month-container");
    if (!container) return;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const startWeekday = firstDay.getDay();      // 月初の曜日
    const totalDays = lastDay.getDate();         // 今月の日数

    // 前月の最終日
    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();

    // ------------------------------
    // ヘッダー（前月・次月）
    // ------------------------------
    // ------------------------------
    // ヘッダー（前月・次月）
    // ------------------------------
    let html = `
    <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:10px 16px;
        font-size:16px;
        font-weight:500;
    ">
        <i class="ti ti-chevron-left"
           style="font-size:22px;color:var(--color-text-tertiary);"
           onclick="prevMonth()"></i>

        <span>${currentYear}年${currentMonth + 1}月</span>

        <i class="ti ti-chevron-right"
           style="font-size:22px;color:var(--color-text-tertiary);"
           onclick="nextMonth()"></i>
    </div>
`;


    // ------------------------------
    // 曜日
    // ------------------------------
    html += `
        <div class="grid7" style="padding:0 16px 4px;font-size:11px;color:var(--color-text-tertiary);text-align:center;">
            <div style="color:var(--color-text-danger);">日</div>
            <div>月</div><div>火</div><div>水</div><div>木</div><div>金</div>
            <div style="color:var(--color-text-info);">土</div>
        </div>
    `;

    // ------------------------------
    // 日付グリッド（6週間固定）
    // ------------------------------
    html += `<div class="grid7" style="padding:0 16px 14px;">`;

    // ① 前月の補完日
    for (let i = 0; i < startWeekday; i++) {
        const day = prevLastDay - startWeekday + 1 + i;
        html += `
            <div class="daycell" style="opacity:0.35;">
                <span class="dnum">${day}</span>
                <span class="dlabel"></span>
            </div>
        `;
    }

    // ② 今月の日付
    for (let d = 1; d <= totalDays; d++) {
        html += `
            <div class="daycell" onclick="openMealCreate(${currentYear}, ${currentMonth + 1}, ${d})">
                <span class="dnum">${d}</span>
                <span class="dlabel">未定</span>
            </div>
        `;
    }

    // ③ 次月の補完日（42セルになるまで埋める）
    const totalCells = startWeekday + totalDays;
    const nextDays = 42 - totalCells;

    for (let d = 1; d <= nextDays; d++) {
        html += `
            <div class="daycell" style="opacity:0.35;">
                <span class="dnum">${d}</span>
                <span class="dlabel"></span>
            </div>
        `;
    }

    html += `</div>`;

    container.innerHTML = html;
}

// ------------------------------
// 月移動
// ------------------------------
function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// ------------------------------
// 日付クリック → 献立作成へ
// ------------------------------
function openMealCreate(y, m, d) {
    sessionStorage.setItem("selectedDate", `${y}年${m}月${d}日`);
    location.hash = "#/meal/create";
}

// 初期表示
window.addEventListener("load", renderCalendar);

// ------------------------------
// 一覧画面（6週間＝42日）生成
// ------------------------------
function renderCalendarList() {
    const container = document.getElementById("calendar-list-container");
    if (!container) return;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();

    let html = "";

    // ① 前月の補完日
    for (let i = 0; i < startWeekday; i++) {
        const day = prevLastDay - startWeekday + 1 + i;
        const date = new Date(currentYear, currentMonth - 1, day);
        const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];

        html += `
            <div class="lrow" style="opacity:0.35;">
                <span style="width:64px;font-size:12px;color:var(--color-text-secondary);">
                    ${date.getMonth() + 1}/${day}（${weekday}）
                </span>
                <i class="ti ti-tools-kitchen-2" style="font-size:15px;color:var(--color-text-tertiary);"></i>
                <span style="flex:1;font-size:13px;">未定</span>
            </div>
        `;
    }

    // ② 今月の日付
    for (let d = 1; d <= totalDays; d++) {
        const date = new Date(currentYear, currentMonth, d);
        const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];

        html += `
            <div class="lrow" onclick="openMealCreate(${currentYear}, ${currentMonth + 1}, ${d})">
                <span style="width:64px;font-size:12px;color:var(--color-text-secondary);">
                    ${currentMonth + 1}/${d}（${weekday}）
                </span>
                <i class="ti ti-tools-kitchen-2" style="font-size:15px;color:var(--color-text-tertiary);"></i>
                <span style="flex:1;font-size:13px;">未定</span>
                <i class="ti ti-chevron-right" style="font-size:14px;color:var(--color-text-tertiary);"></i>
            </div>
        `;
    }

    // ③ 次月の補完日（42セルになるまで）
    const totalCells = startWeekday + totalDays;
    const nextDays = 42 - totalCells;

    for (let d = 1; d <= nextDays; d++) {
        const date = new Date(currentYear, currentMonth + 1, d);
        const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];

        html += `
            <div class="lrow" style="opacity:0.35;">
                <span style="width:64px;font-size:12px;color:var(--color-text-secondary);">
                    ${date.getMonth() + 1}/${d}（${weekday}）
                </span>
                <i class="ti ti-tools-kitchen-2" style="font-size:15px;color:var(--color-text-tertiary);"></i>
                <span style="flex:1;font-size:13px;">未定</span>
            </div>
        `;
    }

    container.innerHTML = html;
}
