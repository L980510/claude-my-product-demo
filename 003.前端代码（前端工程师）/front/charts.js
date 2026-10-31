/* ===== SVG 图表（无依赖，dataviz 规范：细标记、2px 间隙、悬停层、明细表格兜底） ===== */

/**
 * 环形图（分类占比）
 * items: [{ label, value, color, icon }]
 */
function renderDonut(container, items) {
  container.innerHTML = '';
  const total = items.reduce((s, i) => s + i.value, 0);

  if (total <= 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-emoji">🌸</span>暂无支出数据</div>';
    return;
  }

  const size = 200, r = 62, sw = 24;
  const C = 2 * Math.PI * r;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);

  let offset = 0;
  items.forEach((it) => {
    const frac = it.value / total;
    // 2px 表面间隙
    const gap = frac > 0.04 ? 2 : 0;
    const len = Math.max(frac * C - gap, 0.6);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', size / 2);
    circle.setAttribute('cy', size / 2);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', it.color);
    circle.setAttribute('stroke-width', sw);
    circle.setAttribute('stroke-linecap', 'round');
    circle.setAttribute('stroke-dasharray', `${len} ${C - len}`);
    circle.setAttribute('stroke-dashoffset', `${-offset * C}`);
    circle.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
    svg.appendChild(circle);
    offset += frac;
  });

  // 中心文字：总额
  const center = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  center.setAttribute('x', size / 2);
  center.setAttribute('y', size / 2 - 4);
  center.setAttribute('text-anchor', 'middle');
  center.setAttribute('font-size', '11');
  center.setAttribute('fill', '#A89090');
  center.textContent = '总支出';
  const val = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  val.setAttribute('x', size / 2);
  val.setAttribute('y', size / 2 + 16);
  val.setAttribute('text-anchor', 'middle');
  val.setAttribute('font-size', '18');
  val.setAttribute('font-weight', '700');
  val.setAttribute('fill', '#5A4A4A');
  val.textContent = '¥' + fmtYuan(total);
  svg.appendChild(center);
  svg.appendChild(val);

  container.appendChild(svg);
}

/**
 * 折线图（收支趋势）
 * series: [{ name, color, data:number[] }]，labels: string[]
 * data 值为「分」，可为 0
 */
function renderLine(container, series, labels) {
  container.innerHTML = '';
  const hasData = series.some(s => s.data.some(v => v > 0));
  if (!hasData || labels.length === 0) {
    container.innerHTML = '<div class="empty-state"><span class="empty-emoji">📉</span>暂无趋势数据</div>';
    return;
  }

  const W = 320, H = 180;
  const padL = 44, padR = 12, padT = 16, padB = 26;
  const plotW = W - padL - padR, plotH = H - padT - padB;

  const maxVal = Math.max(1, ...series.flatMap(s => s.data));
  const x = (i) => padL + (labels.length === 1 ? plotW / 2 : (i / (labels.length - 1)) * plotW);
  const y = (v) => padT + plotH - (v / maxVal) * plotH;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', H);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // 网格线（弱化）
  const gridLines = 3;
  for (let g = 0; g <= gridLines; g++) {
    const gy = padT + (g / gridLines) * plotH;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padL); line.setAttribute('x2', W - padR);
    line.setAttribute('y1', gy); line.setAttribute('y2', gy);
    line.setAttribute('stroke', '#F3E6EA'); line.setAttribute('stroke-width', 1);
    svg.appendChild(line);
    const tl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tl.setAttribute('x', padL - 6); tl.setAttribute('y', gy + 4);
    tl.setAttribute('text-anchor', 'end'); tl.setAttribute('font-size', '9');
    tl.setAttribute('fill', '#C9B4BA');
    tl.textContent = fmtAxis(maxVal * (1 - g / gridLines));
    svg.appendChild(tl);
  }

  // 折线
  series.forEach((s) => {
    const d = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', s.color);
    path.setAttribute('stroke-width', 2);
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);

    s.data.forEach((v, i) => {
      if (v <= 0) return;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x(i)); c.setAttribute('cy', y(v));
      c.setAttribute('r', 3.2); c.setAttribute('fill', '#fff');
      c.setAttribute('stroke', s.color); c.setAttribute('stroke-width', 2);
      svg.appendChild(c);
    });
  });

  // X 轴标签（抽样）
  const step = Math.max(1, Math.ceil(labels.length / 6));
  labels.forEach((lb, i) => {
    if (i % step !== 0 && i !== labels.length - 1) return;
    const tl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tl.setAttribute('x', x(i)); tl.setAttribute('y', H - 8);
    tl.setAttribute('text-anchor', 'middle'); tl.setAttribute('font-size', '9');
    tl.setAttribute('fill', '#C9B4BA');
    tl.textContent = lb;
    svg.appendChild(tl);
  });

  container.appendChild(svg);
}

/* 工具函数 */
function fmtYuan(fen) {
  return (fen / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}
function fmtAxis(fen) {
  const v = fen / 100;
  if (v >= 10000) return (v / 10000).toFixed(1) + 'w';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'k';
  return v.toFixed(0);
}
