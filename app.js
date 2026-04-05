const teams = [
  {
    id: "mikaduki",
    name: "微積界隈",
    level: 12,
    xpCurrent: 144,
    xpNext: 180,
    energy: "4/5",
    durability: "80/100",
    memberName: "みかづき隊長",
    homeCell: "front-5",
    mails: [
      { title: "マスター通知", body: "正面中央の確保を継続してください。", unread: true },
      { title: "受理通知", body: "スポット報告が受理されました。", unread: true },
      { title: "戦況ログ", body: "右面上段に敵城を確認。", unread: false },
    ],
    members: [
      { name: "みかづき隊長", hp: 92, card: "城壁札 / 朱盾" },
      { name: "せきぶん", hp: 73, card: "攻撃札 / 焔刀" },
      { name: "きょくげん", hp: 61, card: "土台札 / 補給箱" },
    ],
    parts: {
      top: { title: "天守", hp: 95, tag: "Core", effect: "全体耐久補正", stat: "防御 +12" },
      weapon1: { title: "武器1", hp: 74, tag: "Range", effect: "正面攻撃強化", stat: "攻撃 148" },
      weapon2: { title: "武器2", hp: 83, tag: "Guard", effect: "左迎撃強化", stat: "攻撃 117" },
      weapon3: { title: "武器3", hp: 69, tag: "Guard", effect: "右迎撃強化", stat: "攻撃 136" },
      base: { title: "土台", hp: 91, tag: "Base", effect: "移動CT短縮", stat: "HP +20" },
    },
    inventory: { 鉄塊: 4, 木材: 6, ダイヤ: 1, クリスタル: 2, 石材: 20 },
  },
  {
    id: "yorozu",
    name: "夜想連合",
    level: 15,
    xpCurrent: 126,
    xpNext: 200,
    energy: "3/5",
    durability: "74/100",
    memberName: "よぞらヘッド",
    homeCell: "right-5",
    mails: [
      { title: "マスター通知", body: "上面の見張り台を優先確保。", unread: true },
      { title: "合成完了", body: "新しい武器ノードを開放しました。", unread: false },
    ],
    members: [
      { name: "よぞらヘッド", hp: 88, card: "防衛札 / 月白壁" },
      { name: "しんや", hp: 67, card: "攻撃札 / 連装弓" },
      { name: "あけがた", hp: 52, card: "土台札 / 斜面足場" },
    ],
    parts: {
      top: { title: "天守", hp: 88, tag: "Core", effect: "高台防御補正", stat: "防御 +8" },
      weapon1: { title: "武器1", hp: 62, tag: "Range", effect: "先制ダメージ", stat: "攻撃 101" },
      weapon2: { title: "武器2", hp: 90, tag: "Burst", effect: "バフ上火力上昇", stat: "攻撃 93" },
      weapon3: { title: "武器3", hp: 77, tag: "Guard", effect: "命中補助", stat: "攻撃 114" },
      base: { title: "土台", hp: 86, tag: "Base", effect: "面移動CT軽減", stat: "HP +12" },
    },
    inventory: { 鉄塊: 2, 木材: 2, ダイヤ: 3, クリスタル: 3, 石材: 11 },
  },
];

const faceMeta = {
  top: "上面",
  left: "左面",
  front: "正面",
  right: "右面",
  back: "背面",
  bottom: "下面",
};

const worldTeams = [
  { id: "mikaduki", name: "微積界隈", relation: "self", level: 12, hp: 84 },
  { id: "yorozu", name: "夜想連合", relation: "ally", level: 15, hp: 78 },
  { id: "kohaku", name: "琥珀隊", relation: "enemy", level: 11, hp: 66 },
  { id: "sazanami", name: "漣連峰", relation: "enemy", level: 8, hp: 61 },
  { id: "kagero", name: "陽炎陣", relation: "enemy", level: 20, hp: 70 },
  { id: "rinne", name: "輪廻", relation: "enemy", level: 13, hp: 56 },
  { id: "hazuki", name: "葉月組", relation: "enemy", level: 9, hp: 64 },
  { id: "shirabe", name: "調律隊", relation: "enemy", level: 10, hp: 59 },
];

const buffCells = new Set(["top-2", "top-9", "left-8", "back-8", "bottom-4", "right-2"]);
const faces = ["top", "left", "front", "right", "back", "bottom"];

const mapFaces = buildMapFaces();

const skillLayout = {
  nodes: [
    { id: "bronze", title: "青銅刀", state: "unlocked", x: 40, y: 164, recipe: { 鉄塊: 2, 木材: 1 } },
    { id: "flame", title: "焔ノ太刀", state: "unlocked", x: 150, y: 164, recipe: { 鉄塊: 3, クリスタル: 2 } },
    { id: "crystal", title: "晶壁槍", state: "available", x: 260, y: 164, recipe: { 鉄塊: 2, ダイヤ: 2, クリスタル: 1 } },
    { id: "burst", title: "雷砲", state: "available", x: 370, y: 88, recipe: { 鉄塊: 2, 木材: 2, クリスタル: 2 } },
    { id: "guard", title: "守護砲", state: "locked", x: 370, y: 240, recipe: { 石材: 10, クリスタル: 3 } },
    { id: "core", title: "中枢炉", state: "locked", x: 500, y: 164, recipe: { 石材: 12, ダイヤ: 3, クリスタル: 2 } },
  ],
  links: [
    ["bronze", "flame"],
    ["flame", "crystal"],
    ["crystal", "burst"],
    ["crystal", "guard"],
    ["burst", "core"],
    ["guard", "core"],
  ],
};

const reportTypes = {
  raid: {
    label: "襲撃報告",
    fields: [
      { name: "raidTime", label: "攻撃時刻", type: "time" },
      { name: "targetTeam", label: "対象チーム", type: "text" },
      { name: "usedCard", label: "使用カード", type: "text" },
      { name: "comment", label: "詳細コメント", type: "textarea" },
    ],
  },
  spot: {
    label: "スポット達成報告",
    fields: [
      { name: "spotName", label: "スポット名", type: "select", options: ["旧校舎前", "時計塔広場", "中央噴水"] },
      { name: "spotPhoto", label: "証拠写真", type: "file" },
    ],
  },
  mission: {
    label: "ミッション達成報告",
    fields: [
      { name: "missionName", label: "ミッション", type: "select", options: ["暗号解読", "裏導線確認", "高台制圧"] },
      { name: "missionPhoto", label: "証拠写真", type: "file" },
    ],
  },
  contact: {
    label: "お問い合わせ",
    fields: [{ name: "message", label: "内容", type: "textarea" }],
  },
};

const boardPosts = [
  { number: 170, title: "お知らせ", author: "運営", timestamp: "2026/03/28 01:11", body: "現状はモック表示です。世界タブと合成タブの見え方を優先しています。" },
  { number: 169, title: "前線維持", author: "微積界隈@正面", timestamp: "2026/03/27 22:41", body: "正面中央の拠点を維持中。" },
  { number: 168, title: "上面偵察", author: "夜想連合@右面", timestamp: "2026/03/27 21:08", body: "次は上面の見張り台を狙います。" },
];

const state = {
  teamIndex: 0,
  selectedPart: "top",
  selectedCellId: teams[0].homeCell,
  selectedSkill: "bronze",
  activeReportType: "raid",
  boardPageStart: 0,
  mailOpen: false,
  cubeRotationX: -28,
  cubeRotationY: -36,
  cubeDrag: { active: false, x: 0, y: 0, startX: 0, startY: 0 },
  toastTimer: null,
};

function buildMapFaces() {
  const cellIds = [];
  for (const face of faces) {
    for (let row = 1; row <= 3; row += 1) {
      for (let col = 1; col <= 3; col += 1) {
        cellIds.push(`${face}-${(row - 1) * 3 + col}`);
      }
    }
  }

  const occupiedIds = shuffle([...cellIds]).slice(0, worldTeams.length);
  const occupiedMap = new Map(occupiedIds.map((id, index) => [id, worldTeams[index]]));

  return Object.fromEntries(
    faces.map((face) => [
      face,
      Array.from({ length: 9 }, (_, index) => {
        const id = `${face}-${index + 1}`;
        return {
          id,
          terrain: face === "top" ? "高台" : face === "bottom" ? "地下口" : "平地",
          buff: buffCells.has(id) ? "バフ" : null,
          occupant: occupiedMap.get(id) || null,
        };
      }),
    ]),
  );
}

function shuffle(array) {
  const items = [...array];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(((index + 3) * 17) % items.length);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function currentTeam() {
  return teams[state.teamIndex];
}

function getCellById(id) {
  for (const [face, cells] of Object.entries(mapFaces)) {
    const cell = cells.find((item) => item.id === id);
    if (cell) return { face, cell };
  }
  return null;
}

function switchTab(target) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.tab === target);
  });
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.target === target);
  });
}

function renderHome() {
  const team = currentTeam();
  document.getElementById("team-name").textContent = team.name;
  document.getElementById("team-level-label").textContent = `Lv.${team.level} Guild`;
  document.getElementById("energy-text").textContent = team.energy;
  document.getElementById("durability-text").textContent = team.durability;
  document.getElementById("xp-text").textContent = `${team.xpCurrent}/${team.xpNext}`;
  document.getElementById("xp-fill").style.width = `${(team.xpCurrent / team.xpNext) * 100}%`;
  document.getElementById("mail-count").textContent = team.mails.filter((mail) => mail.unread).length;

  document.querySelectorAll(".castle-hotspot").forEach((button) => {
    button.classList.toggle("active", button.dataset.part === state.selectedPart);
  });

  const part = team.parts[state.selectedPart];
  document.getElementById("detail-title").textContent = part.title;
  document.getElementById("detail-tag").textContent = part.tag;
  document.getElementById("part-detail").innerHTML = `
    <div class="stat-tile"><div class="meta-copy">HP</div><strong>${part.hp}%</strong></div>
    <div class="stat-tile"><div class="meta-copy">STAT</div><strong>${part.stat}</strong></div>
    <div class="stat-tile"><div class="meta-copy">EFFECT</div><strong>${part.effect}</strong></div>
    <div class="stat-tile"><div class="meta-copy">OWNER</div><strong>${team.memberName}</strong></div>
  `;

  document.getElementById("member-list").innerHTML = team.members
    .map(
      (member) => `
        <article class="member-item">
          <strong>${member.name}</strong>
          <div class="member-meta">HP ${member.hp}%</div>
          <div class="member-meta">${member.card}</div>
        </article>
      `,
    )
    .join("");

  document.getElementById("mail-panel").classList.toggle("hidden", !state.mailOpen);
  document.getElementById("mail-list").innerHTML = team.mails
    .map(
      (mail) => `
        <article class="member-item">
          <strong>${mail.title}</strong>
          <div class="member-meta">${mail.unread ? "未読" : "既読"}</div>
          <div>${mail.body}</div>
        </article>
      `,
    )
    .join("");
}

function renderMap() {
  Object.entries(mapFaces).forEach(([face, cells]) => {
    const root = document.getElementById(`face-${face}`);
    root.innerHTML = cells.map((cell, index) => renderCell(cell, face, index + 1)).join("");
  });

  document.getElementById("cube-3d").style.transform = `rotateX(${state.cubeRotationX}deg) rotateY(${state.cubeRotationY}deg)`;
  updateCellDetail(state.selectedCellId);
}

function renderCell(cell, face, index) {
  const occupant = cell.occupant;
  const current = currentTeam();
  const relation = occupant?.id === current.id || occupant?.relation === "self" ? "self" : occupant ? "enemy" : cell.buff ? "buff" : "";
  const selected = state.selectedCellId === cell.id ? "selected" : "";
  const title = occupant ? occupant.name : cell.buff || cell.terrain;
  const meta = occupant ? `Lv.${occupant.level}` : faceMeta[face];
  const badge = occupant ? `HP ${occupant.hp}%` : cell.buff || "空き";
  return `
    <button class="face-cell ${relation} ${selected}" data-cell="${cell.id}" type="button">
      <div class="cell-topline">
        <strong>${title}</strong>
        <span class="cell-meta">#${index}</span>
      </div>
      <div class="cell-meta">${meta}</div>
      <span class="cell-chip">${badge}</span>
    </button>
  `;
}

function updateCellDetail(cellId) {
  state.selectedCellId = cellId;
  const found = getCellById(cellId);
  if (!found) return;
  const { face, cell } = found;
  const occupant = cell.occupant;

  document.querySelectorAll(".face-cell").forEach((node) => {
    node.classList.toggle("selected", node.dataset.cell === cellId);
  });

  if (!occupant) {
    document.getElementById("cell-detail").innerHTML = `
      <div class="card-heading">
        <div>
          <p class="meta-copy">${faceMeta[face]}</p>
          <h3>${cell.id}</h3>
        </div>
      </div>
      <div class="detail-columns">
        <div class="stat-tile"><div class="meta-copy">TYPE</div><strong>${cell.terrain}</strong></div>
        <div class="stat-tile"><div class="meta-copy">STATE</div><strong>${cell.buff || "空きマス"}</strong></div>
      </div>
    `;
    return;
  }

  document.getElementById("cell-detail").innerHTML = `
    <div class="card-heading">
      <div>
        <p class="meta-copy">${faceMeta[face]}</p>
        <h3>${occupant.name}</h3>
      </div>
      <span class="detail-tag">${occupant.relation === "enemy" ? "Enemy" : "Guild"}</span>
    </div>
    <div class="detail-columns">
      <div class="stat-tile"><div class="meta-copy">LEVEL</div><strong>Lv.${occupant.level}</strong></div>
      <div class="stat-tile"><div class="meta-copy">HP</div><strong>${occupant.hp}%</strong></div>
      <div class="stat-tile"><div class="meta-copy">FACE</div><strong>${faceMeta[face]}</strong></div>
      <div class="stat-tile"><div class="meta-copy">CELL</div><strong>${cell.id}</strong></div>
    </div>
  `;
}

function centerOnTeam() {
  const current = currentTeam();
  const found = Object.values(mapFaces).flat().find((cell) => cell.occupant?.id === current.id) || getCellById(current.homeCell)?.cell;
  if (found) updateCellDetail(found.id);
  state.cubeRotationX = -28;
  state.cubeRotationY = current.id === "yorozu" ? 42 : -36;
  renderMap();
}

function renderCraft() {
  const nodesById = Object.fromEntries(skillLayout.nodes.map((node) => [node.id, node]));
  const links = skillLayout.links
    .map(([fromId, toId]) => {
      const from = nodesById[fromId];
      const to = nodesById[toId];
      const fromX = from.x + 32;
      const fromY = from.y + 32;
      const toX = to.x + 32;
      const toY = to.y + 32;
      const width = Math.hypot(toX - fromX, toY - fromY);
      const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);
      return `<span class="skill-link" style="left:${fromX}px; top:${fromY}px; width:${width}px; height:3px; transform:rotate(${angle}deg);"></span>`;
    })
    .join("");

  const nodes = skillLayout.nodes
    .map(
      (node) => `
        <button class="skill-node ${node.state}" data-node="${node.id}" type="button" style="left:${node.x}px; top:${node.y}px;">
          <span>+</span>
          <span class="skill-node-label">${node.title}</span>
        </button>
      `,
    )
    .join("");

  document.getElementById("skill-tree").innerHTML = `${links}${nodes}`;
  updateRecipePanel(state.selectedSkill);
}

function updateRecipePanel(nodeId) {
  state.selectedSkill = nodeId;
  const team = currentTeam();
  const node = skillLayout.nodes.find((item) => item.id === nodeId);
  const materials = Object.entries(node.recipe)
    .map(([name, required]) => {
      const owned = team.inventory[name] || 0;
      return `<div class="material-row"><span>${name} x${required}</span><strong>${owned} 所持</strong></div>`;
    })
    .join("");

  document.getElementById("recipe-panel").innerHTML = `
    <div class="card-heading">
      <div>
        <p class="meta-copy">Recipe</p>
        <h3>${node.title}</h3>
      </div>
      <span class="detail-tag">${node.state === "locked" ? "Locked" : node.state === "available" ? "Ready" : "Open"}</span>
    </div>
    ${materials}
    <button class="primary-button" type="button">${node.state === "locked" ? "未開放" : "作成する"}</button>
  `;
}

function renderReports() {
  document.getElementById("report-nav").innerHTML = Object.entries(reportTypes)
    .map(
      ([key, config]) => `
        <button class="${state.activeReportType === key ? "active" : ""}" data-report="${key}" type="button">${config.label}</button>
      `,
    )
    .join("");

  const config = reportTypes[state.activeReportType];
  document.getElementById("report-form").innerHTML = `
    <div class="stat-tile"><div class="meta-copy">送信者</div><strong>${currentTeam().memberName}</strong></div>
    ${config.fields.map(renderField).join("")}
    <button class="primary-button" type="submit">${config.label}を送信</button>
  `;
}

function renderField(field) {
  if (field.type === "textarea") return `<label>${field.label}<textarea name="${field.name}" rows="4"></textarea></label>`;
  if (field.type === "select") return `<label>${field.label}<select name="${field.name}">${field.options.map((option) => `<option>${option}</option>`).join("")}</select></label>`;
  if (field.type === "file") return `<label>${field.label}<input name="${field.name}" type="file" /></label>`;
  return `<label>${field.label}<input name="${field.name}" type="${field.type}" /></label>`;
}

function renderBoard() {
  const visible = boardPosts.slice(state.boardPageStart, state.boardPageStart + 50);
  document.getElementById("board-note").textContent = "DB接続前のモック表示です。見た目と導線を先に詰めています。";
  document.getElementById("board-list").innerHTML = visible
    .map(
      (post) => `
        <article class="member-item board-post">
          <div class="post-head">
            <strong>#${post.number} ${post.title}</strong>
            <span class="post-meta">${post.timestamp}</span>
          </div>
          <div class="post-meta">${post.author}</div>
          <p>${post.body}</p>
        </article>
      `,
    )
    .join("");
}

function changeBoardPage(type) {
  const maxStart = Math.max(boardPosts.length - 50, 0);
  if (type === "latest") state.boardPageStart = 0;
  if (type === "next") state.boardPageStart = Math.min(state.boardPageStart + 50, maxStart);
  if (type === "prev") state.boardPageStart = Math.max(state.boardPageStart - 50, 0);
  if (type === "oldest") state.boardPageStart = maxStart;
  renderBoard();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

function wireCubeDrag() {
  const viewport = document.getElementById("cube-viewport");

  viewport.addEventListener("pointerdown", (event) => {
    state.cubeDrag.active = true;
    state.cubeDrag.startX = event.clientX;
    state.cubeDrag.startY = event.clientY;
    state.cubeDrag.x = state.cubeRotationX;
    state.cubeDrag.y = state.cubeRotationY;
    viewport.classList.add("dragging");
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!state.cubeDrag.active) return;
    const dx = event.clientX - state.cubeDrag.startX;
    const dy = event.clientY - state.cubeDrag.startY;
    state.cubeRotationY = state.cubeDrag.y + dx * 0.35;
    state.cubeRotationX = Math.max(-70, Math.min(70, state.cubeDrag.x - dy * 0.25));
    renderMap();
  });

  function stopDrag(event) {
    if (!state.cubeDrag.active) return;
    state.cubeDrag.active = false;
    viewport.classList.remove("dragging");
    if (event.pointerId !== undefined) viewport.releasePointerCapture(event.pointerId);
  }

  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);
}

function wireEvents() {
  document.getElementById("bottom-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-target]");
    if (button) switchTab(button.dataset.target);
  });

  document.querySelector(".castle-stage").addEventListener("click", (event) => {
    const button = event.target.closest("[data-part]");
    if (!button) return;
    state.selectedPart = button.dataset.part;
    renderHome();
  });

  document.getElementById("team-switch").addEventListener("click", () => {
    state.teamIndex = (state.teamIndex + 1) % teams.length;
    state.selectedCellId = currentTeam().homeCell;
    state.mailOpen = false;
    renderHome();
    renderMap();
    renderCraft();
    renderReports();
    centerOnTeam();
  });

  document.getElementById("mail-button").addEventListener("click", () => {
    state.mailOpen = !state.mailOpen;
    renderHome();
  });

  document.getElementById("close-mail").addEventListener("click", () => {
    state.mailOpen = false;
    renderHome();
  });

  document.getElementById("cube-3d").addEventListener("click", (event) => {
    const button = event.target.closest("[data-cell]");
    if (button) updateCellDetail(button.dataset.cell);
  });

  document.getElementById("center-on-team").addEventListener("click", centerOnTeam);
  document.getElementById("rotate-left").addEventListener("click", () => {
    state.cubeRotationY -= 30;
    renderMap();
  });
  document.getElementById("rotate-right").addEventListener("click", () => {
    state.cubeRotationY += 30;
    renderMap();
  });

  document.getElementById("skill-tree").addEventListener("click", (event) => {
    const button = event.target.closest("[data-node]");
    if (button) updateRecipePanel(button.dataset.node);
  });

  document.getElementById("report-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-report]");
    if (!button) return;
    state.activeReportType = button.dataset.report;
    renderReports();
  });

  document.getElementById("report-form").addEventListener("submit", (event) => {
    event.preventDefault();
    showToast(`${reportTypes[state.activeReportType].label}を送信しました`);
  });

  document.querySelector(".pager").addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (button) changeBoardPage(button.dataset.page);
  });

  const dialog = document.getElementById("post-dialog");
  document.getElementById("new-post").addEventListener("click", () => {
    dialog.showModal();
    document.querySelector('#post-form input[name="author"]').value = `${currentTeam().name}@${faceMeta[getCellById(state.selectedCellId).face]}`;
  });
  document.getElementById("cancel-post").addEventListener("click", () => dialog.close());

  document.getElementById("post-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    boardPosts.unshift({
      number: Number(boardPosts[0]?.number || 0) + 1,
      title: formData.get("title"),
      author: formData.get("author"),
      timestamp: new Date().toLocaleString("ja-JP"),
      body: formData.get("body"),
    });
    renderBoard();
    dialog.close();
    event.target.reset();
    showToast("掲示板に投稿しました");
  });

  wireCubeDrag();
}

function init() {
  renderHome();
  renderMap();
  renderCraft();
  renderReports();
  renderBoard();
  wireEvents();
  centerOnTeam();
}

init();
