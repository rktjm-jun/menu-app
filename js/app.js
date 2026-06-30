
import { createRecipe, getRecipes, getRecipeById, updateRecipe, upsertMealPlan, fetchMealPlanByDate } from "./api.js";

// ------------------------------
// 献立作成画面：閉じる処理
// ------------------------------
function closeMealCreate() {
    location.hash = "#/calendar/month";
}

// ------------------------------
// グローバル関数：カレンダーから献立作成画面を開く
// ------------------------------
window.openMealCreate = function openMealCreate(dateStr) {
    try {
        if (dateStr) {
            sessionStorage.setItem("selectedDate", dateStr);
            console.log("[openMealCreate] selectedDate set:", dateStr);
        } else {
            console.log("[openMealCreate] no date provided");
        }
        // クエリは付けずにハッシュだけ切り替える
        location.hash = "#/meal/create";
    } catch (err) {
        console.error("openMealCreate error:", err);
    }
};


// ------------------------------
// 献立作成画面：日付の読み込み
// ------------------------------
window.addEventListener("hashchange", () => {
    const normalized = location.hash.split('?')[0];
    if (normalized === "#/meal/create") {
        const d = sessionStorage.getItem("selectedDate");
        if (d) {
            const el = document.getElementById("meal-date");
            if (el) {
                el.textContent = d;
            } else {
                setTimeout(() => {
                    const el2 = document.getElementById("meal-date");
                    if (el2) el2.textContent = d;
                }, 50);
            }
        }
    }
});

// ------------------------------
// レシピ関連：Supabase 連携
// ------------------------------


/**
 * ハッシュのクエリ部分をパースしてオブジェクトで返す
 * 例: "#/recipe/form?id=7" -> { id: "7" }
 */
function parseHashQuery() {
    const hash = location.hash || "";
    const qIndex = hash.indexOf("?");
    if (qIndex === -1) return {};
    const q = hash.slice(qIndex + 1);
    return Object.fromEntries(new URLSearchParams(q));
}

function initRecipeFormPage() {
    console.log("initRecipeFormPage called");
    const section = document.getElementById("recipe-form");
    if (!section) return;

    // .finput の順番に対応
    const inputs = section.querySelectorAll(".finput");
    const titleInput = inputs[0];
    const ingredientsInput = inputs[1];
    const instructionsInput = inputs[2];

    // ヘッダやボタン要素（あれば文言を切替）
    const headerTitle = section.querySelector(".recipe-form-title");
    const submitBtnSelector = ".recipe-form-submit";

    // submit ボタン取得と既存リスナーのクリア
    let submitBtn = section.querySelector(submitBtnSelector);
    if (!submitBtn) return;
    submitBtn.replaceWith(submitBtn.cloneNode(true));
    submitBtn = section.querySelector(submitBtnSelector);

    // 編集モード判定（#/recipe/form?id=7 の ?id= を読む）
    const params = parseHashQuery();
    const editId = params.id ? String(params.id) : null;

    // 初期フォーム状態のセット
    if (editId) {
        if (headerTitle) headerTitle.textContent = "レシピ編集";
        submitBtn.textContent = "更新する";

        // 非同期で既存データを取得してフォームにセット
        (async () => {
            try {
                const rec = await getRecipeById(editId);
                if (!rec) {
                    console.error("レシピ取得に失敗しました:", editId);
                    alert("レシピの読み込みに失敗しました");
                    return;
                }
                titleInput.value = rec.title || "";
                ingredientsInput.value = rec.description || "";
                instructionsInput.value = rec.instructions || "";
                // 必要なら他フィールドもここでセット
            } catch (err) {
                console.error("getRecipeById 例外:", err);
                alert("レシピの読み込み中にエラーが発生しました");
            }
        })();
    } else {
        if (headerTitle) headerTitle.textContent = "レシピ登録";
        submitBtn.textContent = "保存する";
        // 新規時はフォームを空に
        titleInput.value = "";
        ingredientsInput.value = "";
        instructionsInput.value = "";
    }

    // クリックハンドラ（新規 or 更新を切替）
    submitBtn.addEventListener("click", async () => {
        console.log("保存ボタンが押されました (editId:", editId, ")");
        const title = titleInput.value.trim();
        const ingredients = ingredientsInput.value.trim();
        const instructions = instructionsInput.value.trim();

        if (!title) {
            alert("料理名は必須です");
            return;
        }

        // 作成/更新で送るデータを組み立てる
        const recipePayload = {
            title,
            description: ingredients,
            instructions,
            minutes: 0,
            thumbnail_url: "",
        };

        // 送信中はボタンを無効化して二重送信を防ぐ
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = editId ? "更新中..." : "送信中...";

        try {
            if (editId) {
                // 更新（PATCH）: created_at は通常更新しない
                const updated = await updateRecipe(editId, recipePayload);
                if (Array.isArray(updated) && updated.length > 0) {
                    alert("レシピを更新しました！");
                    location.hash = "#/recipe/list";
                } else {
                    console.error("updateRecipe returned no data", updated);
                    alert("更新に失敗しました");
                }
            } else {
                // 新規作成（POST）
                // created_at を付けるのはサーバ側でも可。ここでは付けておく。
                recipePayload.created_at = new Date().toISOString();
                const result = await createRecipe(recipePayload);
                if (Array.isArray(result) && result.length > 0) {
                    alert("レシピを登録しました！");
                    // フォームをクリアして一覧へ
                    titleInput.value = "";
                    ingredientsInput.value = "";
                    instructionsInput.value = "";
                    location.hash = "#/recipe/list";
                } else {
                    console.error("createRecipe returned no data", result);
                    alert("登録に失敗しました…");
                }
            }
        } catch (err) {
            console.error("保存処理で例外:", err);
            alert("保存中にエラーが発生しました。コンソールを確認してください。");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
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

            // クリックで編集画面に遷移できるようにする
            row.addEventListener('click', () => {
                location.hash = `#/recipe/form?id=${r.id || ''}`;
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

/* ------------------------------
   レシピ選択画面の初期化（recipe-select）
------------------------------ */
async function initRecipeSelectPage() {
    console.log("initRecipeSelectPage called");
    const section = document.getElementById("recipe-select");
    if (!section) return;

    const listContainer = section.querySelector('.recipe-select-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="loading">読み込み中…</div>';

    const data = await getRecipes({ limit: 200, orderBy: 'created_at', order: 'desc' });
    if (data === null) {
        listContainer.innerHTML = '<div class="error">レシピの取得に失敗しました。後でもう一度お試しください。</div>';
        return;
    }

    if (data.length === 0) {
        listContainer.innerHTML = '<div class="empty">登録されたレシピがありません。</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    data.forEach(r => {
        const row = document.createElement('div');
        row.className = 'rrow select-row';
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.padding = '8px 0';

        const left = document.createElement('div');
        left.style.flex = '1';
        left.style.minWidth = '0';

        const titleP = document.createElement('p');
        titleP.style.margin = '0';
        titleP.style.fontSize = '14px';
        titleP.style.fontWeight = '500';
        titleP.textContent = r.title || '無題';

        const descP = document.createElement('p');
        descP.style.margin = '2px 0 0';
        descP.style.fontSize = '11px';
        descP.style.color = 'var(--color-text-secondary)';
        descP.textContent = (r.description || r.instructions) ? '材料・作り方あり' : '';

        left.appendChild(titleP);
        left.appendChild(descP);

        const radioWrap = document.createElement('div');
        radioWrap.style.marginLeft = '12px';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'selectedRecipe';
        radio.value = String(r.id);
        radio.id = `recipe-radio-${r.id}`;

        radioWrap.appendChild(radio);

        row.appendChild(left);
        row.appendChild(radioWrap);

        fragment.appendChild(row);
    });

    listContainer.innerHTML = '';
    listContainer.appendChild(fragment);

    const decideBtnSelector = '.recipe-select-submit';
    let decideBtn = section.querySelector(decideBtnSelector);
    if (!decideBtn) return;
    decideBtn.replaceWith(decideBtn.cloneNode(true));
    decideBtn = section.querySelector(decideBtnSelector);

    decideBtn.addEventListener('click', async () => {
        const sel = section.querySelector('input[name="selectedRecipe"]:checked');
        if (!sel) {
            alert('レシピを選択してください');
            return;
        }
        const recipeId = Number(sel.value);
        const date = sessionStorage.getItem('selectedDate');
        if (!date) {
            alert('選択された日付が見つかりません');
            location.hash = '#/calendar/month';
            return;
        }

        const mealType = sessionStorage.getItem('selectedMealType') || 'dinner';

        try {
            const res = await upsertMealPlan({ date, meal_type: mealType, recipe_id: recipeId });
            if (!res) {
                alert('献立の登録に失敗しました');
                return;
            }
            alert('献立を登録しました');
            location.hash = '#/calendar/month';
        } catch (err) {
            console.error('initRecipeSelectPage upsert error', err);
            alert('献立の登録中にエラーが発生しました');
        }
    });
}

window.initRecipeSelectPage = initRecipeSelectPage;

/* ------------------------------
   新規追加: 選択日付の献立を読み込んで画面に反映する
------------------------------ */
async function loadMealForSelectedDate() {
    try {
        const date = sessionStorage.getItem("selectedDate");

        const emptyText = document.getElementById('meal-create-empty-text');
        const buttonsBox = document.querySelector('.meal-create-buttons');
        const selectedBox = document.getElementById('meal-selected-recipe');
        const titleEl = document.getElementById('meal-selected-recipe-title');
        const subEl = document.getElementById('meal-selected-recipe-sub');

        const randomBox = document.getElementById('meal-create-random-box');
        const randomName = document.getElementById('meal-create-random-name');
        const randomThumb = document.getElementById('meal-create-random-thumb');
        const randomAgainBtn = document.getElementById('meal-create-random-again');
        const randomDecideBtn = document.getElementById('meal-create-random-decide');
        const randomTriggerBtn = document.getElementById('meal-create-btn-random');

        // 必須要素チェック
        if (!emptyText || !buttonsBox || !selectedBox || !titleEl) {
            console.warn('loadMealForSelectedDate: required DOM missing');
            return;
        }

        // 初期状態: ランダム結果は非表示（ボタン押下で表示）
        if (randomBox) randomBox.style.display = 'none';

        if (!date) {
            // 日付が無い場合は未決定表示
            emptyText.style.display = 'block';
            buttonsBox.style.display = 'flex';
            selectedBox.style.display = 'none';
            return;
        }

        // API から該当日の献立を取得
        const plan = await fetchMealPlanByDate(date);
        console.log('loadMealForSelectedDate plan:', plan);

        if (plan && plan.recipes) {
            // 決定済み: 日付、選択済みレシピ、一覧ボタン、削除ボタンを表示
            titleEl.textContent = plan.recipes.title || 'レシピ';
            subEl.textContent = plan.recipes.thumbnail_url ? '写真あり' : 'レシピが登録されています';

            emptyText.style.display = 'none';
            buttonsBox.style.display = 'none'; // 未決定用ボタンは隠す
            selectedBox.style.display = 'block';
        } else {
            // 未決定: 未決定テキストと操作ボタンを表示、選択済み表示は隠す
            emptyText.style.display = 'block';
            buttonsBox.style.display = 'flex';
            selectedBox.style.display = 'none';
        }

        // 変更ボタン（一覧へ）
        const changeBtn = document.getElementById('meal-selected-change');
        if (changeBtn) changeBtn.onclick = () => { location.hash = '#/recipe/select'; };

        // 削除ボタン（簡易）
        const clearBtn = document.getElementById('meal-selected-clear');
        if (clearBtn) {
            clearBtn.onclick = async () => {
                if (!confirm('この日の献立を削除しますか？')) return;
                try {
                    const mealType = sessionStorage.getItem('selectedMealType') || 'dinner';
                    const res = await upsertMealPlan({ date, meal_type: mealType, recipe_id: null });
                    if (!res) {
                        alert('削除に失敗しました');
                        return;
                    }
                    await loadMealForSelectedDate();
                    alert('献立を削除しました');
                } catch (err) {
                    console.error('clear meal error', err);
                    alert('削除に失敗しました');
                }
            };
        }

        // ランダム提案ボタンのハンドラ（初回押下でランダム候補を取得して表示）
        if (randomTriggerBtn) {
            randomTriggerBtn.onclick = async () => {
                try {
                    // 取得は getRecipes を利用（モックや件数に応じて調整）
                    const all = await getRecipes({ limit: 200, orderBy: 'created_at', order: 'desc' });
                    if (!Array.isArray(all) || all.length === 0) {
                        alert('レシピが登録されていません');
                        return;
                    }
                    // ランダム選択
                    const pick = all[Math.floor(Math.random() * all.length)];
                    // 表示更新
                    if (randomName) randomName.textContent = pick.title || 'レシピ';
                    if (randomThumb) {
                        // サムネイルがあれば img を差し替える簡易処理
                        if (pick.thumbnail_url && pick.thumbnail_url.startsWith('http')) {
                            randomThumb.innerHTML = `<img src="${escapeHtml(pick.thumbnail_url)}" alt="${escapeHtml(pick.title || '')}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;">`;
                        } else {
                            randomThumb.innerHTML = '<i class="ti ti-tools-kitchen-2" aria-hidden="true"></i>';
                        }
                    }
                    if (randomBox) randomBox.style.display = 'block';

                    // もう一度ボタン
                    if (randomAgainBtn) {
                        randomAgainBtn.onclick = () => {
                            // 再度トリガーと同じ処理を呼ぶ
                            randomTriggerBtn.onclick();
                        };
                    }

                    // この献立に決定
                    if (randomDecideBtn) {
                        randomDecideBtn.onclick = async () => {
                            if (!confirm(`この献立に決定しますか？\n${pick.title}`)) return;
                            try {
                                const mealType = sessionStorage.getItem('selectedMealType') || 'dinner';
                                const up = await upsertMealPlan({ date, meal_type: mealType, recipe_id: pick.id });
                                if (!up) {
                                    alert('登録に失敗しました');
                                    return;
                                }
                                await loadMealForSelectedDate();
                                alert(`献立を登録しました: ${pick.title}`);
                            } catch (err) {
                                console.error('random decide error', err);
                                alert('登録に失敗しました');
                            }
                        };
                    }
                } catch (err) {
                    console.error('random propose error', err);
                    alert('ランダム提案に失敗しました');
                }
            };
        }

    } catch (err) {
        console.error('loadMealForSelectedDate exception:', err);
    }
}
window.loadMealForSelectedDate = loadMealForSelectedDate;

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
