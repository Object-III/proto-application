const backButton = document.getElementById("back-button");
const forwardButton = document.getElementById("forward-button");
const openFolderButton = document.getElementById("open-folder");
const openFestivalFileButton = document.getElementById("open-festival-file");
const openWitnessFileButton = document.getElementById("open-witness-file");
const openScpFileButton = document.getElementById("open-scp-file");
const sidebarFolderButton = document.getElementById("sidebar-folder");
const folderView = document.getElementById("folder-view");
const fileView = document.getElementById("file-view");
const previewView = document.getElementById("preview-view");
const previewImage = document.getElementById("preview-image");

const previewMap = {
  festival: {
    src: "./アイコン_2大開催祭チラシ.png",
    alt: "大開催祭チラシ",
  },
  witness: {
    src: "./アイコン1_開催予告目撃.png",
    alt: "開催予告目撃",
  },
  scp: {
    src: "./アイコン3_SCP.png",
    alt: "SCP文書",
  },
};

const historyStack = [{ type: "folder" }];
const forwardStack = [];
let currentState = historyStack[0];

function applyState(state) {
  folderView.classList.toggle("active", state.type === "folder");
  fileView.classList.toggle("active", state.type === "files");
  previewView.classList.toggle("active", state.type === "preview");

  if (state.type === "preview") {
    const preview = previewMap[state.previewKey];
    if (preview) {
      previewImage.src = preview.src;
      previewImage.alt = preview.alt;
    }
  }

  currentState = state;
  backButton.disabled = historyStack.length <= 1;
  forwardButton.disabled = forwardStack.length === 0;
}

function isSameState(a, b) {
  return a.type === b.type && a.previewKey === b.previewKey;
}

function navigateTo(nextState) {
  if (isSameState(currentState, nextState)) return;
  historyStack.push(nextState);
  forwardStack.length = 0;
  applyState(nextState);
}

function goBack() {
  if (historyStack.length <= 1) return;
  const current = historyStack.pop();
  forwardStack.push(current);
  applyState(historyStack[historyStack.length - 1]);
}

function goForward() {
  if (forwardStack.length === 0) return;
  const next = forwardStack.pop();
  historyStack.push(next);
  applyState(next);
}

openFolderButton.addEventListener("click", () => navigateTo({ type: "files" }));
openFestivalFileButton.addEventListener("click", () => navigateTo({ type: "preview", previewKey: "festival" }));
openWitnessFileButton.addEventListener("click", () => navigateTo({ type: "preview", previewKey: "witness" }));
openScpFileButton.addEventListener("click", () => navigateTo({ type: "preview", previewKey: "scp" }));
sidebarFolderButton.addEventListener("click", () => navigateTo({ type: "folder" }));
backButton.addEventListener("click", goBack);
forwardButton.addEventListener("click", goForward);

if (window.location.hash === "#open") {
  historyStack.push({ type: "files" });
  applyState(historyStack[historyStack.length - 1]);
} else {
  applyState(historyStack[0]);
}
