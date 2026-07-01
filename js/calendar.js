// js/calendar.js
// ------------------------------
// 月間カレンダー（前月・次月の補完日つき）
// ------------------------------

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0 = Jan

function formatYMD(y, m, d) {
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
}

async function renderCalendar() {
    const container = document.getElementById("calendar-month-container");
    if (!container) return;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();

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

    html += `
        <div class="grid7" style="padding:0 16px 4px;font-size:11px;color:var(--color-text-tertiary);text-align:center;">
            <div style="color:var(--color-text-danger);">日</div>
            <div>月</div><div>火</div><div>水</div><div>木</div><div>金</div>
            <div style="color:var(--color-text-info);">土</div>
        </div>
    `;

    html += `<div class="grid7" style="padding:0 16px 14px;">`;

    // 前月の補完日
    for (let i = 0; i < startWeekday; i++) {
        const day = prevLastDay - startWeekday + 1 + i;
        html += `
            <div class="daycell" style="opacity:0.35;">
                <span class="dnum">${day}</span>
                <span class="dlabel"></span>
            </div>
        `;
    }

    // 今月の日付（data-date 属性で日付を保持）
    for (let d = 1; d <= totalDays; d++) {
        const y = currentYear;
        const m = currentMonth + 1;
        const dateStr = formatYMD(y, m, d);
        html += `
            <div class="daycell" data-date="${dateStr}">
                <span class="dnum">${d}</span>
                <span class="dlabel">未定</span>
            </div>
        `;
    }

    // 次月の補完日
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

    // イベント委譲で日付クリックを処理
    container.removeEventListener('click', calendarClickHandler);
    container.addEventListener('click', calendarClickHandler);

    // 月描画後に該当月の献立を取得してセルに反映する
    // yearMonth は "YYYY-MM"
    const yearMonth = `${String(currentYear)}-${String(currentMonth + 1).padStart(2, '0')}`;
    populateMealsOnCalendar(yearMonth);
}

// イベントハンドラはそのまま
function calendarClickHandler(e) {
    const cell = e.target.closest('.daycell');
    if (!cell) return;
    const dateStr = cell.getAttribute('data-date');
    if (!dateStr) return;
    // data-date は YYYY-MM-DD
    sessionStorage.setItem("selectedDate", dateStr);
    console.log('[calendar] selectedDate set:', dateStr);
    location.hash = "#/meal/create";
}

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

// 初期表示
window.addEventListener("load", renderCalendar);

/* ------------------------------
   meal_plans を取得してカレンダーに反映する
   依存: window.fetchMealPlans(yearMonth) を呼べること
------------------------------ */
async function populateMealsOnCalendar(yearMonth) {
    try {
        if (typeof window.fetchMealPlans !== 'function') {
            // fetchMealPlans が未公開なら何もしない
            console.warn('populateMealsOnCalendar: fetchMealPlans not available');
            return;
        }

        const plans = await window.fetchMealPlans(yearMonth);
        if (!Array.isArray(plans)) return;

        // date をキーにした map を作る
        const map = {};
        plans.forEach(p => {
            if (p && p.date) {
                map[p.date] = p;
            }
        });

        // カレンダー上のセルを走査して更新
        document.querySelectorAll('.daycell[data-date]').forEach(cell => {
            const d = cell.dataset.date;
            const label = cell.querySelector('.dlabel');
            if (!label) return;
            if (map[d] && map[d].recipes && map[d].recipes.title) {
                label.textContent = map[d].recipes.title;
                label.classList.add('has-meal');
            } else {
                label.textContent = '未定';
                label.classList.remove('has-meal');
            }
        });
    } catch (err) {
        console.error('populateMealsOnCalendar error', err);
    }
}

// 該当日だけを再取得して更新するユーティリティ（upsert 後に呼ぶ）
async function updateCalendarCellForDate(date) {
    try {
        if (!date) return;
        // まずセルがあるか確認
        const cell = document.querySelector(`.daycell[data-date="${date}"]`);
        if (!cell) return;

        // fetchMealPlanByDate が公開されていればそれを使う（より軽量）
        if (typeof window.fetchMealPlanByDate === 'function') {
            const plan = await window.fetchMealPlanByDate(date);
            const label = cell.querySelector('.dlabel');
            if (!label) return;
            if (plan && plan.recipes && plan.recipes.title) {
                label.textContent = plan.recipes.title;
                label.classList.add('has-meal');
            } else {
                label.textContent = '未定';
                label.classList.remove('has-meal');
            }
            return;
        }

        // 代替: 月全体を再取得して反映（フォールバック）
        const ym = date.slice(0, 7); // "YYYY-MM"
        await populateMealsOnCalendar(ym);
    } catch (err) {
        console.error('updateCalendarCellForDate error', err);
    }
}

// グローバルに公開して他から呼べるようにする
window.updateCalendarCellForDate = updateCalendarCellForDate;
window.populateMealsOnCalendar = populateMealsOnCalendar;

// 追加: カレンダー描画とナビゲーションをグローバルに公開
window.renderCalendar = renderCalendar;
window.prevMonth = prevMonth;
window.nextMonth = nextMonth;

// 一覧画面（6週間＝42日）生成（既存の実装を維持しつつ meal_plans を反映）
function renderCalendarList() {
    const container = document.getElementById("calendar-list-container");
    if (!container) return;

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const startWeekday = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const prevLastDay = new Date(currentYear, currentMonth, 0).getDate();

    let html = "";

    // 前月の補完日
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

    // 今月の日付
    for (let d = 1; d <= totalDays; d++) {
        const date = new Date(currentYear, currentMonth, d);
        const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()];
        const dateStr = formatYMD(date.getFullYear(), date.getMonth() + 1, d);

        html += `
            <div class="lrow" data-date="${dateStr}">
                <span style="width:64px;font-size:12px;color:var(--color-text-secondary);">
                    ${currentMonth + 1}/${d}（${weekday}）
                </span>
                <i class="ti ti-tools-kitchen-2" style="font-size:15px;color:var(--color-text-tertiary);"></i>
                <span style="flex:1;font-size:13px;">未定</span>
                <i class="ti ti-chevron-right" style="font-size:14px;color:var(--color-text-tertiary);"></i>
            </div>
        `;
    }

    // 次月の補完日
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

    // 一覧のクリックも委譲して献立作成へ遷移
    container.removeEventListener('click', calendarListClickHandler);
    container.addEventListener('click', calendarListClickHandler);

    // 一覧でも meal_plans を反映する（同じ年月）
    const yearMonth = `${String(currentYear)}-${String(currentMonth + 1).padStart(2, '0')}`;
    if (typeof window.fetchMealPlans === 'function') {
        window.fetchMealPlans(yearMonth).then(plans => {
            if (!Array.isArray(plans)) return;
            const map = {};
            plans.forEach(p => { if (p && p.date) map[p.date] = p; });
            container.querySelectorAll('.lrow[data-date]').forEach(row => {
                const d = row.dataset.date;
                const span = row.querySelector('span[style*="flex:1"]');
                if (!span) return;
                if (map[d] && map[d].recipes && map[d].recipes.title) {
                    span.textContent = map[d].recipes.title;
                } else {
                    span.textContent = '未定';
                }
            });
        }).catch(err => console.error('renderCalendarList fetchMealPlans error', err));
    }
}
