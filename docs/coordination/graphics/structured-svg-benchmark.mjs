const W = 1240;
const CARD_W = 320;
const ROW_H = 50;
const HEADER_H = 60;
const CARD_GAP = 10;

const palette = {
  bg: '#ffffff',
  text: '#111827',
  panel: '#e5e7eb',
  row: '#f3f4f6',
  active: '#9ed39a',
  hpc: '#75a9d0',
  gpu: '#e7b45a',
  qpu: '#a882b8',
  border: '#9ca3af',
  edge: '#111827',
};

const esc = (s) => String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function cardHeight(rows) {
  return 20 + HEADER_H + CARD_GAP + rows.length * (ROW_H + CARD_GAP) + 10;
}

function resourceCard({ id, label, kind, x, y, rows }) {
  const h = cardHeight(rows);
  const header = palette[kind] || palette.hpc;
  const body = [`<g id="node-${esc(id)}" data-node-id="${esc(id)}" transform="translate(${x} ${y})">`,
    `<rect width="${CARD_W}" height="${h}" rx="10" fill="${palette.panel}" stroke="${header}" stroke-width="2"/>`,
    `<rect x="16" y="16" width="${CARD_W-32}" height="${HEADER_H}" rx="7" fill="${header}"/>`,
    `<text x="${CARD_W/2}" y="54" text-anchor="middle" class="title">${esc(label)}</text>`];
  let ry = 16 + HEADER_H + CARD_GAP;
  for (const row of rows) {
    body.push(`<rect x="16" y="${ry}" width="${CARD_W-32}" height="${ROW_H}" rx="6" fill="${row.active ? palette.active : palette.row}" stroke="${palette.border}"/>`);
    body.push(`<text x="30" y="${ry+32}" class="body">${esc(row.label)}</text>`);
    body.push(`<text x="${CARD_W-30}" y="${ry+32}" text-anchor="end" class="body">${esc(row.value)}</text>`);
    ry += ROW_H + CARD_GAP;
  }
  body.push(`</g>`);
  return {
    svg: body.join(''),
    anchors: {
      leftTop: [x, y + 112],
      rightTop: [x + CARD_W, y + 112],
      leftBottom: [x, y + h - 45],
      rightBottom: [x + CARD_W, y + h - 45],
      leftMid: [x, y + h/2],
      rightMid: [x + CARD_W, y + h/2],
    },
    bounds: {x,y,w:CARD_W,h}
  };
}

function edgePath({ id, from, to, label, via = [], arrow = true, labelAt }) {
  const points = [from, ...via, to];
  const d = points.map((p,i) => `${i===0?'M':'L'} ${p[0]} ${p[1]}`).join(' ');
  const mid = labelAt || [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const labelSvg = label ? `<g class="edge-label" transform="translate(${mid[0]} ${mid[1]-22})"><rect x="-58" y="-20" width="116" height="40" rx="6"/><text text-anchor="middle" y="6">${esc(label)}</text></g>` : '';
  return `<g id="edge-${esc(id)}" data-edge-id="${esc(id)}"><path d="${d}" class="edge" ${arrow?'marker-end="url(#arrow)"':''}/>${labelSvg}</g>`;
}

function dot(id, x, y) {
  return `<circle id="anchor-${esc(id)}" data-anchor-id="${esc(id)}" cx="${x}" cy="${y}" r="8" fill="${palette.edge}"/>`;
}

function svgShell(title, height, body, desc) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-labelledby="diagram-title diagram-desc">
<title id="diagram-title">${esc(title)}</title><desc id="diagram-desc">${esc(desc)}</desc>
<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="${palette.edge}"/></marker></defs>
<style>
  .title{font:600 28px Inter,system-ui,sans-serif;fill:${palette.text}}
  .body{font:400 18px Inter,system-ui,sans-serif;fill:${palette.text}}
  .edge{fill:none;stroke:${palette.edge};stroke-width:6;stroke-linecap:round;stroke-linejoin:round}
  .edge-label rect{fill:${palette.panel};stroke:${palette.border}}
  .edge-label text{font:400 17px Inter,system-ui,sans-serif;fill:${palette.text}}
  .caption{font:600 20px Inter,system-ui,sans-serif;fill:${palette.text}}
</style>
<rect width="100%" height="100%" fill="${palette.bg}"/>
<text x="20" y="30" class="caption">${esc(title)}</text>
${body}
</svg>`;
}

export function renderVariant(name) {
  if (name === 'baseline') {
    const hpc = resourceCard({id:'hpc', label:'HPC', kind:'hpc', x:20, y:80, rows:[{label:'Working',value:1000,active:true},{label:'Idle',value:0},{label:'Blocked',value:0}]});
    const qpu = resourceCard({id:'qpu', label:'QPU', kind:'qpu', x:900, y:80, rows:[{label:'Queue',value:0},{label:'Run',value:0}]});
    const sendY = hpc.anchors.rightTop[1];
    const returnY = hpc.anchors.rightBottom[1];
    const body = hpc.svg + qpu.svg
      + edgePath({id:'send',from:hpc.anchors.rightTop,to:qpu.anchors.leftTop,label:'Transfer',labelAt:[620,hpc.anchors.rightTop[1]]})
      + edgePath({id:'return',from:qpu.anchors.leftBottom,to:hpc.anchors.rightBottom,label:'Transfer',via:[[860,qpu.anchors.leftBottom[1]],[860,350],[360,350],[360,hpc.anchors.rightBottom[1]]],labelAt:[620,350]});
    return svgShell('01 Baseline — legacy HPC ↔ QPU', 400, body, 'HPC resource state connected to QPU state by send and return transfer paths.');
  }
  if (name === 'move-qpu') {
    const hpc = resourceCard({id:'hpc', label:'HPC', kind:'hpc', x:20, y:80, rows:[{label:'Working',value:1000,active:true},{label:'Idle',value:0},{label:'Blocked',value:0}]});
    const qpu = resourceCard({id:'qpu', label:'QPU', kind:'qpu', x:790, y:80, rows:[{label:'Queue',value:0},{label:'Run',value:0}]});
    const body = hpc.svg + qpu.svg
      + edgePath({id:'send',from:hpc.anchors.rightTop,to:qpu.anchors.leftTop,label:'Transfer',labelAt:[565,hpc.anchors.rightTop[1]]})
      + edgePath({id:'return',from:qpu.anchors.leftBottom,to:hpc.anchors.rightBottom,label:'Transfer',via:[[750,qpu.anchors.leftBottom[1]],[750,350],[360,350],[360,hpc.anchors.rightBottom[1]]],labelAt:[565,350]});
    return svgShell('02 Edit — QPU moved by changing one logical column', 400, body, 'The QPU card is moved while its edges re-anchor to named ports.');
  }
  if (name === 'add-gpu') {
    const hpc = resourceCard({id:'hpc', label:'HPC', kind:'hpc', x:20, y:100, rows:[{label:'Working',value:1000,active:true},{label:'Idle',value:0},{label:'Blocked',value:0}]});
    const gpu = resourceCard({id:'gpu', label:'GPU', kind:'gpu', x:460, y:100, rows:[{label:'Active',value:8,active:true},{label:'Idle',value:0}]});
    const qpu = resourceCard({id:'qpu', label:'QPU', kind:'qpu', x:900, y:100, rows:[{label:'Queue',value:0},{label:'Run',value:0}]});
    const body = hpc.svg + gpu.svg + qpu.svg
      + edgePath({id:'hpc-gpu',from:hpc.anchors.rightMid,to:gpu.anchors.leftMid})
      + edgePath({id:'gpu-qpu',from:gpu.anchors.rightMid,to:qpu.anchors.leftMid});
    return svgShell('03 Edit — GPU lane inserted', 420, body, 'GPU is added as a resource lane between HPC and QPU using the same card and anchor grammar.');
  }
  if (name === 'fork-join') {
    const hpc = resourceCard({id:'hpc', label:'HPC', kind:'hpc', x:20, y:145, rows:[{label:'Working',value:1000,active:true},{label:'Idle',value:0},{label:'Blocked',value:0}]});
    const gpu = resourceCard({id:'gpu', label:'GPU', kind:'gpu', x:620, y:55, rows:[{label:'Active',value:8,active:true},{label:'Idle',value:0}]});
    const qpu = resourceCard({id:'qpu', label:'QPU', kind:'qpu', x:620, y:315, rows:[{label:'Queue',value:0},{label:'Run',value:0}]});
    const fork = [450, 275];
    const join = [1080, 275];
    const body = hpc.svg + gpu.svg + qpu.svg + dot('fork',...fork) + dot('join',...join)
      + edgePath({id:'hpc-fork',from:hpc.anchors.rightMid,to:fork})
      + edgePath({id:'fork-gpu',from:fork,to:gpu.anchors.leftMid,via:[[520,fork[1]],[520,gpu.anchors.leftMid[1]]]})
      + edgePath({id:'fork-qpu',from:fork,to:qpu.anchors.leftMid,via:[[520,fork[1]],[520,qpu.anchors.leftMid[1]]]})
      + edgePath({id:'gpu-join',from:gpu.anchors.rightMid,to:join,via:[[1010,gpu.anchors.rightMid[1]],[1010,join[1]]]})
      + edgePath({id:'qpu-join',from:qpu.anchors.rightMid,to:join,via:[[1010,qpu.anchors.rightMid[1]],[1010,join[1]]]});
    return svgShell('04 Edit — serial flow changed to fork / join', 600, body, 'HPC forks to GPU and QPU branches and rejoins; orthogonal routes are anchored to stable named ports.');
  }
  throw new Error(`Unknown variant: ${name}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const name = process.argv[2] || 'baseline';
  process.stdout.write(renderVariant(name));
}
