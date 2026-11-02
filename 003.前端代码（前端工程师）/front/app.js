/* ===== 消费记账 · V1 主逻辑 =====
 * 数据通过后端 API 存取（JWT 鉴权），本地仅保留 token
 * 金额统一以「分」为整数存储
 */

// ===== 常量 =====
const EMOJIS = ['🍜','🚌','🛍️','🏠','🎮','💊','📚','🎁','📦','💰','🎉','📈','🧧','🏪','💡','👥','🚚','🧾','🧮','🛒','🛠️','☕','🍔','🚗','🐱','✈️','🎬','💄','🏋️','🐶'];
const COLORS = ['#E8577F','#A05AD9','#F28A3E','#35A87C','#D9A81E','#3F91D6','#C14B86','#82B440','#7B6CC0','#FF9EB5','#F4719A','#FFC9A9'];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// ===== 工具 =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function fmtDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function todayStr() { return fmtDate(new Date()); }
function monthKey(s) { return s.slice(0, 7); }
function ymd(dstr) { const p = dstr.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function toFen(str) { const n = parseFloat(str); return isNaN(n) ? 0 : Math.round(n * 100); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

// ===== 状态（内存，来自后端） =====
let currentUser = null;  // {id, username, scene, lastExpenseCategoryId, lastIncomeCategoryId}
let categories = [];
let records = [];
let budget = null;       // {id, month, amount} 或 null

let homeType = 'expense';
let selectedCatId = null;
let billMonth = monthKey(todayStr());
let statsRange = 'month';
let editingRecordId = null;
let editingCategoryId = null;
let editType = 'expense';
let editSelectedCatId = null;
let catModalType = 'expense';
let catModalEmoji = '📦';
let catModalColor = '#FF9EB5';

function lastCatId(type) {
  return currentUser ? (type === 'expense' ? currentUser.lastExpenseCategoryId : currentUser.lastIncomeCategoryId) : null;
}

// ===== Toast =====
let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 1600);
}

// ===== 视图切换 =====
function switchView(name) {
  $$('.view').forEach((v) => v.classList.remove('active'));
  $('#view-' + name).classList.add('active');
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.view === name));
  if (name === 'home') $('#amount-input').focus();
  if (name === 'bills') renderBills();
  if (name === 'stats') renderStats();
  if (name === 'settings') renderSettings();
}

// ===== 记一笔 =====
function renderHome() {
  const type = homeType;
  const cats = categories.filter((c) => c.type === type).sort((a, b) => a.sort - b.sort);
  if (!cats.find((c) => c.id === selectedCatId)) {
    const last = lastCatId(type);
    selectedCatId = (last && cats.find((c) => c.id === last)) ? last : (cats[0] ? cats[0].id : null);
  }
  $('#category-count').textContent = `${type === 'expense' ? '支出' : '收入'} · ${cats.length} 个分类`;
  renderCategoryGrid($('#category-grid'), cats, selectedCatId, (id) => { selectedCatId = id; });
}

function renderCategoryGrid(container, cats, selectedId, onSelect) {
  container.innerHTML = '';
  if (cats.length === 0) {
    container.innerHTML = '<div class="empty-hint">暂无分类，去「我的 → 分类管理」添加</div>';
    return;
  }
  cats.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cat-item' + (c.id === selectedId ? ' selected' : '');
    b.innerHTML = `<div class="cat-icon" style="background:${c.color}22">${c.icon}</div><div class="cat-name">${c.name}</div>`;
    b.onclick = () => { onSelect(c.id); renderCategoryGrid(container, cats, c.id, onSelect); };
    container.appendChild(b);
  });
}

async function saveRecord() {
  const raw = $('#amount-input').value.trim();
  if (!raw) { toast('请输入金额'); return; }
  let amountPart = raw, notePart = $('#note-input').value.trim();
  // 快捷语法：`28 午餐`
  if (!notePart) {
    const m = raw.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (m) { amountPart = m[1]; notePart = m[2]; }
  }
  const fen = toFen(amountPart);
  if (fen <= 0 || fen > 999999999) { toast('请输入有效金额'); return; }
  if (!selectedCatId) { toast('请选择分类'); return; }

  try {
    const r = await http.post('/records', {
      type: homeType, amount: fen, categoryId: selectedCatId,
      note: notePart.slice(0, 50), date: $('#date-input').value || todayStr()
    });
    records.push(r);
    if (homeType === 'expense') currentUser.lastExpenseCategoryId = selectedCatId;
    else currentUser.lastIncomeCategoryId = selectedCatId;

    $('#amount-input').value = '';
    $('#note-input').value = '';
    const btn = $('#save-btn');
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 300);
    toast('已记录 ✓');
    $('#amount-input').focus();
  } catch (e) { toast(e.message); }
}

// ===== 账单 =====
function renderBills() {
  $('#bills-month-title').textContent = billMonth.replace('-', '年') + '月';

  const monthRecords = records
    .filter((r) => monthKey(r.date) === billMonth)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  const expense = monthRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const income = monthRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const balance = income - expense;
  $('#bills-summary').innerHTML =
    `支出 <b>${fmtYuan(expense)}</b> · 收入 <b>${fmtYuan(income)}</b> · 结余 <b>${fmtYuan(balance)}</b>`;

  const list = $('#bills-list');
  if (monthRecords.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="empty-emoji">🌸</span>这个月还没有记录</div>';
    return;
  }

  // 按天分组
  const byDay = {};
  monthRecords.forEach((r) => { (byDay[r.date] = byDay[r.date] || []).push(r); });
  const days = Object.keys(byDay).sort().reverse();

  list.innerHTML = '';
  days.forEach((d) => {
    const dayRecords = byDay[d];
    const dayExpense = dayRecords.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const dayIncome = dayRecords.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const wd = WEEKDAYS[ymd(d).getDay()];

    const group = document.createElement('div');
    group.className = 'day-group';
    const net = dayIncome - dayExpense;
    const netStr = net > 0 ? `收入 ¥${fmtYuan(dayIncome)}` : (net < 0 ? `支出 ¥${fmtYuan(dayExpense)}` : '');
    group.innerHTML = `<div class="day-header"><span>${d.slice(5).replace('-', '月')}日 周${wd}</span><span>${netStr}</span></div>`;

    dayRecords.forEach((r) => {
      const c = categories.find((x) => x.id === r.categoryId) || { name: '未知', icon: '❓', color: '#C9B4BA' };
      const row = document.createElement('div');
      row.className = 'bill-row';
      row.innerHTML = `
        <div class="cat-icon" style="background:${c.color}22">${c.icon}</div>
        <div class="bill-info">
          <div class="bill-name">${c.name}</div>
          ${r.note ? `<div class="bill-note">${escapeHtml(r.note)}</div>` : ''}
        </div>
        <div class="bill-amount ${r.type}">${r.type === 'expense' ? '-' : '+'}¥${fmtYuan(r.amount)}</div>`;
      row.onclick = () => openRecordModal(r.id);
      group.appendChild(row);
    });

    list.appendChild(group);
  });
}

// ===== 统计 =====
function getRange(range) {
  const now = new Date();
  const days = [];
  if (range === 'week') {
    const day = now.getDay() || 7;
    const mon = new Date(now); mon.setDate(now.getDate() - day + 1);
    for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); days.push(fmtDate(d)); }
  } else {
    let y = now.getFullYear(), m = now.getMonth();
    if (range === 'lastmonth') { m -= 1; }
    const dim = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= dim; i++) days.push(fmtDate(new Date(y, m, i)));
  }
  return days;
}

function renderStats() {
  const days = getRange(statsRange);
  const inRange = records.filter((r) => days.includes(r.date));
  const expense = inRange.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const income = inRange.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const balance = income - expense;
  const sceneLabel = currentUser && currentUser.scene === 'business' ? '毛利' : '结余';

  $('#summary-cards').innerHTML = `
    <div class="summary-card"><div class="s-label">收入</div><div class="s-value income">¥${fmtYuan(income)}</div></div>
    <div class="summary-card"><div class="s-label">支出</div><div class="s-value expense">¥${fmtYuan(expense)}</div></div>
    <div class="summary-card"><div class="s-label">${sceneLabel}</div><div class="s-value balance">¥${fmtYuan(balance)}</div></div>`;

  // 分类占比（仅支出）
  const expRecords = inRange.filter((r) => r.type === 'expense');
  const catSum = {};
  expRecords.forEach((r) => { catSum[r.categoryId] = (catSum[r.categoryId] || 0) + r.amount; });
  const items = categories
    .filter((c) => c.type === 'expense' && catSum[c.id])
    .map((c) => ({ label: c.name, icon: c.icon, color: c.color, value: catSum[c.id] }))
    .sort((a, b) => b.value - a.value);

  renderDonut($('#donut-chart'), items);
  const legend = $('#donut-legend');
  if (items.length === 0) { legend.innerHTML = ''; }
  else {
    const total = items.reduce((s, i) => s + i.value, 0);
    legend.innerHTML = items.map((it) => `
      <div class="legend-row">
        <span class="legend-dot" style="background:${it.color}"></span>
        <span class="legend-name">${it.icon} ${escapeHtml(it.label)}</span>
        <span class="legend-val">¥${fmtYuan(it.value)}</span>
        <span class="legend-pct">${(it.value / total * 100).toFixed(1)}%</span>
      </div>`).join('');
  }

  // 趋势
  const dailyExp = days.map((d) => inRange.filter((r) => r.type === 'expense' && r.date === d).reduce((s, r) => s + r.amount, 0));
  const dailyInc = days.map((d) => inRange.filter((r) => r.type === 'income' && r.date === d).reduce((s, r) => s + r.amount, 0));
  const labels = days.map((d) => d.slice(5).replace('-', '/'));
  renderLine($('#line-chart'),
    [
      { name: '支出', color: '#F4719A', data: dailyExp },
      { name: '收入', color: '#35A87C', data: dailyInc }
    ], labels);
  $('#line-legend').innerHTML = `
    <span class="ll-item"><span class="ll-dot" style="background:#F4719A"></span>支出</span>
    <span class="ll-item"><span class="ll-dot" style="background:#35A87C"></span>收入</span>`;

  // 预算（本月）
  renderBudget();
}

function renderBudget() {
  const box = $('#budget-box');
  const mk = monthKey(todayStr());
  const spent = records.filter((r) => r.type === 'expense' && monthKey(r.date) === mk).reduce((s, r) => s + r.amount, 0);

  if (!budget) {
    box.innerHTML = `<div class="budget-nums">还没设置本月预算，去「我的 → 月度预算」设置一个吧 🌸</div>`;
    return;
  }
  const amount = budget.amount;
  const pct = Math.min(100, Math.round(spent / amount * 100));
  const over = spent > amount;
  const remain = amount - spent;
  box.innerHTML = `
    <div class="budget-progress"><div class="budget-fill ${over ? 'over' : ''}" style="width:${pct}%"></div></div>
    <div class="budget-nums">已花 <b>¥${fmtYuan(spent)}</b> / 预算 <b>¥${fmtYuan(amount)}</b></div>
    ${over
      ? `<div class="budget-warn">⚠️ 已超支 ¥${fmtYuan(-remain)}</div>`
      : (remain <= amount * 0.2 ? `<div class="budget-warn">⚠️ 剩余预算不足 20%</div>` : `<div class="budget-nums">剩余 ¥${fmtYuan(remain)}</div>`)}`;
}

// ===== 我的 / 分类管理 =====
function renderSettings() {
  $('#user-desc').textContent = currentUser ? currentUser.username : '未登录';
  const sceneName = currentUser && currentUser.scene === 'business' ? '经营 / 个体户' : '个人 / 家庭';
  $('#scene-desc').textContent = sceneName;
  $('#budget-desc').textContent = budget ? `¥${fmtYuan(budget.amount)} / 月` : '未设置';
  renderCategoryManage();
}

function renderCategoryManage() {
  const box = $('#category-manage');
  box.innerHTML = '';
  ['expense', 'income'].forEach((type) => {
    const cats = categories.filter((c) => c.type === type).sort((a, b) => a.sort - b.sort);
    cats.forEach((c) => {
      const count = records.filter((r) => r.categoryId === c.id).length;
      const row = document.createElement('div');
      row.className = 'cm-row';
      row.innerHTML = `
        <div class="cat-icon" style="background:${c.color}22">${c.icon}</div>
        <div class="cm-info">
          <div class="cm-name">${escapeHtml(c.name)}</div>
          <div class="cm-meta">${type === 'expense' ? '支出' : '收入'} · ${count} 笔</div>
        </div>
        <div class="cm-actions">
          <button data-act="edit">编辑</button>
          <button data-act="del" class="del">删除</button>
        </div>`;
      row.querySelector('[data-act="edit"]').onclick = () => openCategoryModal(c.id);
      row.querySelector('[data-act="del"]').onclick = () => deleteCategory(c.id);
      box.appendChild(row);
    });
  });
}

async function deleteCategory(id) {
  const c = categories.find((x) => x.id === id);
  if (!c) return;
  if (c.isSystem && c.name === '其他') { toast('「其他」分类不可删除'); return; }
  const linked = records.filter((r) => r.categoryId === id);
  const other = categories.find((x) => x.type === c.type && x.isSystem && x.name === '其他');
  if (linked.length > 0 && !other) { toast('缺少「其他」分类，无法转移'); return; }
  if (!confirm(`删除「${c.name}」？${linked.length ? `该分类下 ${linked.length} 笔流水将转移到「其他」` : ''}`)) return;

  try {
    await http.del('/categories/' + id);
    // 服务端已转移流水并删除分类，重新同步
    const [cats, recs] = await Promise.all([http.get('/categories'), http.get('/records')]);
    categories = cats;
    records = recs;
    if (selectedCatId === id) selectedCatId = null;
    renderSettings();
    renderHome();
    toast('已删除');
  } catch (e) { toast(e.message); }
}

function openCategoryModal(id) {
  editingCategoryId = id || null;
  const c = id ? categories.find((x) => x.id === id) : null;
  $('#category-modal-title').textContent = id ? '编辑分类' : '新增分类';
  catModalType = c ? c.type : 'expense';
  $('#cat-name').value = c ? c.name : '';
  catModalEmoji = c ? c.icon : '📦';
  catModalColor = c ? c.color : '#FF9EB5';
  syncCatTypeButtons();
  renderEmojiPicker();
  renderColorPicker();
  $('#category-modal').classList.remove('hidden');
}

function syncCatTypeButtons() {
  $('#cat-type-expense').classList.toggle('active', catModalType === 'expense');
  $('#cat-type-income').classList.toggle('active', catModalType === 'income');
}

function renderEmojiPicker() {
  const box = $('#cat-emoji-picker');
  box.innerHTML = '';
  EMOJIS.forEach((e) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = e;
    b.className = e === catModalEmoji ? 'selected' : '';
    b.onclick = () => { catModalEmoji = e; renderEmojiPicker(); };
    box.appendChild(b);
  });
}

function renderColorPicker() {
  const box = $('#cat-color-picker');
  box.innerHTML = '';
  COLORS.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.style.background = c;
    b.className = c === catModalColor ? 'selected' : '';
    b.onclick = () => { catModalColor = c; renderColorPicker(); };
    box.appendChild(b);
  });
}

async function saveCategory() {
  const name = $('#cat-name').value.trim();
  if (!name) { toast('请输入分类名称'); return; }
  const dup = categories.some((c) => c.name === name && c.type === catModalType && c.id !== editingCategoryId);
  if (dup) { toast('该分类已存在'); return; }
  const payload = { name, type: catModalType, icon: catModalEmoji, color: catModalColor };
  try {
    if (editingCategoryId) {
      const c = await http.put('/categories/' + editingCategoryId, payload);
      categories = categories.map((x) => (x.id === editingCategoryId ? c : x));
    } else {
      const c = await http.post('/categories', payload);
      categories.push(c);
    }
    $('#category-modal').classList.add('hidden');
    renderSettings();
    renderHome();
    toast('已保存');
  } catch (e) { toast(e.message); }
}

// ===== 记录编辑 =====
function openRecordModal(id) {
  editingRecordId = id;
  const r = records.find((x) => x.id === id);
  if (!r) return;
  editType = r.type;
  editSelectedCatId = r.categoryId;
  $('#edit-amount').value = fmtYuan(r.amount);
  $('#edit-note').value = r.note || '';
  $('#edit-date').value = r.date;
  syncEditTypeButtons();
  renderEditCategoryGrid();
  $('#record-modal').classList.remove('hidden');
}

function syncEditTypeButtons() {
  $('#edit-type-expense').classList.toggle('active', editType === 'expense');
  $('#edit-type-income').classList.toggle('active', editType === 'income');
}

function renderEditCategoryGrid() {
  const cats = categories.filter((c) => c.type === editType).sort((a, b) => a.sort - b.sort);
  if (!cats.find((c) => c.id === editSelectedCatId)) editSelectedCatId = cats[0] ? cats[0].id : null;
  renderCategoryGrid($('#edit-category-grid'), cats, editSelectedCatId, (id) => { editSelectedCatId = id; });
}

async function saveRecordEdit() {
  const fen = toFen($('#edit-amount').value);
  if (fen <= 0) { toast('请输入有效金额'); return; }
  if (!editSelectedCatId) { toast('请选择分类'); return; }
  try {
    const r = await http.put('/records/' + editingRecordId, {
      type: editType, amount: fen, categoryId: editSelectedCatId,
      note: $('#edit-note').value.trim().slice(0, 50), date: $('#edit-date').value || todayStr()
    });
    records = records.map((x) => (x.id === editingRecordId ? r : x));
    $('#record-modal').classList.add('hidden');
    renderBills();
    toast('已保存');
  } catch (e) { toast(e.message); }
}

async function deleteRecord() {
  if (!confirm('确定删除这笔流水？')) return;
  try {
    await http.del('/records/' + editingRecordId);
    records = records.filter((r) => r.id !== editingRecordId);
    $('#record-modal').classList.add('hidden');
    renderBills();
    toast('已删除');
  } catch (e) { toast(e.message); }
}

// ===== 场景 =====
async function initScene(scene) {
  const wasFirst = !currentUser.scene;
  try {
    const data = await http.put('/user/scene', { scene });
    currentUser.scene = data.scene;
    categories = data.categories;
    $('#onboarding').classList.add('hidden');
    renderAll();
    if (!wasFirst) toast('场景已切换');
  } catch (e) { toast(e.message); }
}

// ===== 预算 =====
function openBudgetModal() {
  $('#budget-amount').value = budget ? fmtYuan(budget.amount) : '';
  $('#budget-modal').classList.remove('hidden');
  $('#budget-amount').focus();
}
async function saveBudget() {
  const fen = toFen($('#budget-amount').value);
  if (fen <= 0) { toast('请输入有效预算'); return; }
  try {
    budget = await http.put('/budget', { month: monthKey(todayStr()), amount: fen });
    $('#budget-modal').classList.add('hidden');
    renderSettings();
    toast('预算已设置');
  } catch (e) { toast(e.message); }
}

// ===== 导出 =====
function exportCSV() {
  if (records.length === 0) { toast('暂无数据'); return; }
  const header = ['类型', '金额(元)', '分类', '备注', '日期'];
  const rows = records
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
    .map((r) => {
      const c = categories.find((x) => x.id === r.categoryId);
      return [r.type === 'expense' ? '支出' : '收入', (r.amount / 100).toFixed(2), c ? c.name : '', r.note || '', r.date];
    });
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `消费记账_${todayStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
  toast('已导出 CSV');
}

// ===== 渲染总入口 =====
function renderAll() {
  renderHome();
  renderBills();
  renderStats();
  renderSettings();
}

// ===== 认证 =====
function showAuthPage(mode) {
  $('#auth-login').classList.toggle('hidden', mode !== 'login');
  $('#auth-register').classList.toggle('hidden', mode !== 'register');
}
function showAuth() {
  showAuthPage('login');
  $('.app').classList.add('hidden');
}
function showApp() {
  $('#auth-login').classList.add('hidden');
  $('#auth-register').classList.add('hidden');
  $('.app').classList.remove('hidden');
}

function showLoading() { $('#loading').classList.remove('hidden'); }
function hideLoading() { $('#loading').classList.add('hidden'); }

// 登录/注册后加载数据并渲染（无场景则先选场景）
async function enterApp() {
  showApp();
  showLoading();
  try {
    const mk = monthKey(todayStr());
    const [cats, recs, bud] = await Promise.all([
      http.get('/categories'),
      http.get('/records'),
      http.get('/budget?month=' + mk)
    ]);
    categories = cats;
    records = recs;
    budget = bud;
    if (currentUser.scene) renderAll();
    else $('#onboarding').classList.remove('hidden');
  } catch (e) { toast(e.message); }
  finally { hideLoading(); }
}

async function doLogin() {
  const username = $('#login-username').value.trim();
  const password = $('#login-password').value;
  if (!username || !password) { toast('请输入用户名和密码'); return; }
  try {
    const data = await http.post('/auth/login', { username, password });
    setToken(data.token, $('#login-remember').checked);
    currentUser = data.user;
    await enterApp();
  } catch (e) { toast(e.message); }
}

async function doRegister() {
  const username = $('#reg-username').value.trim();
  const password = $('#reg-password').value;
  const password2 = $('#reg-password2').value;
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { toast('用户名需 3-20 位字母/数字/下划线'); return; }
  if (password.length < 6 || password.length > 32) { toast('密码需 6-32 位'); return; }
  if (password !== password2) { toast('两次密码不一致'); return; }
  try {
    const data = await http.post('/auth/register', { username, password });
    setToken(data.token, true); // 注册成功后自动登录
    currentUser = data.user;
    $('#reg-username').value = '';
    $('#reg-password').value = '';
    $('#reg-password2').value = '';
    await enterApp();
  } catch (e) { toast(e.message); }
}

function doLogout() {
  if (!confirm('确定退出登录？')) return;
  clearToken();
  currentUser = null;
  categories = [];
  records = [];
  budget = null;
  $('#login-password').value = '';
  showAuth();
}

// ===== 初始化 =====
async function init() {
  $('#date-input').value = todayStr();
  $('#edit-date').value = todayStr();

  // 全局 401：清空状态并跳回登录
  setUnauthorizedHandler(() => { currentUser = null; showAuth(); });

  // 底部导航
  $$('.tab').forEach((t) => {
    t.onclick = () => switchView(t.dataset.view);
  });

  // 首页类型切换
  $('#type-expense').onclick = () => setHomeType('expense');
  $('#type-income').onclick = () => setHomeType('income');
  $('#save-btn').onclick = saveRecord;

  // 账单月份
  $('#prev-month').onclick = () => { shiftBillMonth(-1); };
  $('#next-month').onclick = () => { shiftBillMonth(1); };

  // 统计
  $$('.range-btn').forEach((b) => {
    b.onclick = () => {
      statsRange = b.dataset.range;
      $$('.range-btn').forEach((x) => x.classList.toggle('active', x === b));
      renderStats();
    };
  });

  // 设置
  $('#switch-scene-btn').onclick = () => { $('#onboarding').classList.remove('hidden'); };
  $('#set-budget-btn').onclick = openBudgetModal;
  $('#export-btn').onclick = exportCSV;
  $('#add-category-btn').onclick = () => openCategoryModal(null);

  // 场景选择（首次 & 切换）
  $$('.scene-card').forEach((b) => {
    b.onclick = () => initScene(b.dataset.scene);
  });

  // 记录编辑弹窗
  $('#edit-type-expense').onclick = () => { editType = 'expense'; syncEditTypeButtons(); renderEditCategoryGrid(); };
  $('#edit-type-income').onclick = () => { editType = 'income'; syncEditTypeButtons(); renderEditCategoryGrid(); };
  $('#edit-save-btn').onclick = saveRecordEdit;
  $('#edit-cancel-btn').onclick = () => $('#record-modal').classList.add('hidden');
  $('#edit-delete-btn').onclick = deleteRecord;

  // 分类弹窗
  $('#cat-type-expense').onclick = () => { catModalType = 'expense'; syncCatTypeButtons(); };
  $('#cat-type-income').onclick = () => { catModalType = 'income'; syncCatTypeButtons(); };
  $('#cat-save-btn').onclick = saveCategory;
  $('#cat-cancel-btn').onclick = () => $('#category-modal').classList.add('hidden');

  // 预算弹窗
  $('#budget-save-btn').onclick = saveBudget;
  $('#budget-cancel-btn').onclick = () => $('#budget-modal').classList.add('hidden');

  // 点击遮罩关闭弹窗
  $$('.overlay').forEach((o) => {
    o.addEventListener('click', (e) => { if (e.target === o) o.classList.add('hidden'); });
  });

  // 回车快速保存
  $('#amount-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveRecord(); });

  // 认证相关事件
  $('#login-btn').onclick = doLogin;
  $('#register-btn').onclick = doRegister;
  $('#logout-btn').onclick = doLogout;
  $('#to-register').onclick = (e) => { e.preventDefault(); showAuthPage('register'); };
  $('#to-login').onclick = (e) => { e.preventDefault(); showAuthPage('login'); };
  $('#login-username').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  $('#login-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  $('#reg-password2').addEventListener('keydown', (e) => { if (e.key === 'Enter') doRegister(); });

  // 登录门禁：有 token 则自动恢复会话
  if (!getToken()) { showAuth(); return; }
  try {
    currentUser = await http.get('/user/me');
    await enterApp();
  } catch (e) {
    if (getToken()) toast(e.message);
    showAuth();
  }
}

function setHomeType(type) {
  homeType = type;
  $('#type-expense').classList.toggle('active', type === 'expense');
  $('#type-income').classList.toggle('active', type === 'income');
  const last = lastCatId(type);
  selectedCatId = (categories.find((c) => c.id === last)) ? last : null;
  renderHome();
}

function shiftBillMonth(delta) {
  const p = billMonth.split('-').map(Number);
  const d = new Date(p[0], p[1] - 1 + delta, 1);
  billMonth = monthKey(fmtDate(d));
  renderBills();
}

init();
