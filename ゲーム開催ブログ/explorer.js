const backButton = document.getElementById("back-button");
const openFolderButton = document.getElementById("open-folder");
const openFestivalFileButton = document.getElementById("open-festival-file");
const openWitnessFileButton = document.getElementById("open-witness-file");
const sidebarFolderButton = document.getElementById("sidebar-folder");
const folderView = document.getElementById("folder-view");
const fileView = document.getElementById("file-view");
const previewView = document.getElementById("preview-view");
const previewImage = document.getElementById("preview-image");

function setActiveView(viewName) {
  folderView.classList.toggle("active", viewName === "folder");
  fileView.classList.toggle("active", viewName === "files");
  previewView.classList.toggle("active", viewName === "preview");
}

function showFileView() {
  setActiveView("files");
}

function showFolderView() {
  setActiveView("folder");
}

function showPreviewView() {
  setActiveView("preview");
}

function openPreviewFromButton(button) {
  previewImage.src = button.dataset.preview;
  previewImage.alt = button.getAttribute("aria-label") || "開催予告画像";
  showPreviewView();
}

openFolderButton.addEventListener("click", showFileView);
openFestivalFileButton.addEventListener("click", () => {
  openPreviewFromButton(openFestivalFileButton);
});
openWitnessFileButton.addEventListener("click", () => {
  openPreviewFromButton(openWitnessFileButton);
});
backButton.addEventListener("click", showFolderView);

sidebarFolderButton.addEventListener("click", () => {
  showFolderView();
});

if (window.location.hash === "#open") {
  showFileView();
}
