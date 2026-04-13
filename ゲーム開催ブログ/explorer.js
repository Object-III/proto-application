const backButton = document.getElementById("back-button");
const forwardButton = document.getElementById("forward-button");
const openFolderButton = document.getElementById("open-folder");
const openFestivalFileButton = document.getElementById("open-festival-file");
const openWitnessFileButton = document.getElementById("open-witness-file");
const sidebarFolderButton = document.getElementById("sidebar-folder");
const folderView = document.getElementById("folder-view");
const fileView = document.getElementById("file-view");
const previewView = document.getElementById("preview-view");
const previewImage = document.getElementById("preview-image");

const historyStack = ["folder"];
const forwardStack = [];
let currentView = "folder";

function setActiveView(viewName) {
  folderView.classList.toggle("active", viewName === "folder");
  fileView.classList.toggle("active", viewName === "files");
  previewView.classList.toggle("active", viewName === "preview");
  currentView = viewName;
  backButton.disabled = historyStack.length <= 1;
  forwardButton.disabled = forwardStack.length === 0;
}

function navigateTo(viewName) {
  if (currentView === viewName) return;
  historyStack.push(viewName);
  forwardStack.length = 0;
  setActiveView(viewName);
}

function showFolderView() {
  navigateTo("folder");
}

function showFileView() {
  navigateTo("files");
}

function showPreviewView() {
  navigateTo("preview");
}

function openPreviewFromButton(button) {
  previewImage.src = button.dataset.preview;
  previewImage.alt = button.getAttribute("aria-label") || "開催予告画像";
  showPreviewView();
}

function goBack() {
  if (historyStack.length <= 1) return;
  const current = historyStack.pop();
  forwardStack.push(current);
  setActiveView(historyStack[historyStack.length - 1]);
}

function goForward() {
  if (forwardStack.length === 0) return;
  const next = forwardStack.pop();
  historyStack.push(next);
  setActiveView(next);
}

openFolderButton.addEventListener("click", showFileView);
openFestivalFileButton.addEventListener("click", () => openPreviewFromButton(openFestivalFileButton));
openWitnessFileButton.addEventListener("click", () => openPreviewFromButton(openWitnessFileButton));
backButton.addEventListener("click", goBack);
forwardButton.addEventListener("click", goForward);
sidebarFolderButton.addEventListener("click", showFolderView);

if (window.location.hash === "#open") {
  historyStack.push("files");
  setActiveView("files");
} else {
  setActiveView("folder");
}
