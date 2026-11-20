const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

const tabBar = document.getElementById('tab-bar');
const listContainer = document.getElementById('list-container');
const prefixSelect = document.getElementById('prefix-select');
const addBoxBtn = document.getElementById('add-box-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

const imageModal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalCloseBtn = document.getElementById('modal-close-btn');

const moonIcon = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
`;

const sunIcon = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
`;

function createDefaultTab(title = 'Untitled') {
  return {
    id: 'tab-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    title,
    prefixType: 'number', // 'number' | 'bullet' | 'asterisk'
    items: [
      { id: 'item-' + Date.now(), text: '', checked: false, images: [] }
    ]
  };
}

let appState = {
  darkMode: false,
  activeTabId: null,
  tabs: []
};

let dataFilePath = null;

function getDataFilePath() {
  if (!dataFilePath) {
    const userDataDir = ipcRenderer.sendSync('get-user-data-path');
    dataFilePath = path.join(userDataDir, 'notelist-data.json');
  }
  return dataFilePath;
}

function saveAppState() {
  try {
    const filePath = getDataFilePath();
    fs.writeFileSync(filePath, JSON.stringify(appState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save notelist data:', err);
  }
}

function loadAppState() {
  try {
    const filePath = getDataFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
        appState = {
          darkMode: Boolean(parsed.darkMode),
          activeTabId: parsed.activeTabId || parsed.tabs[0].id,
          tabs: parsed.tabs
        };
        if (!appState.tabs.some(t => t.id === appState.activeTabId)) {
          appState.activeTabId = appState.tabs[0].id;
        }
        return;
      }
    }
  } catch (err) {
    console.error('Failed to load saved data, starting fresh:', err);
  }

  const initialTab = createDefaultTab('Untitled');
  appState = {
    darkMode: false,
    activeTabId: initialTab.id,
    tabs: [initialTab]
  };
}

function getActiveTab() {
  return appState.tabs.find(t => t.id === appState.activeTabId) || appState.tabs[0];
}

function applyTheme() {
  document.body.classList.toggle('dark-mode', appState.darkMode);
  themeToggleBtn.innerHTML = appState.darkMode ? sunIcon : moonIcon;
  themeToggleBtn.title = appState.darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
}

// Modal Controls
function openImageModal(src) {
  modalImg.src = src;
  imageModal.classList.add('open');
}

function closeImageModal() {
  imageModal.classList.remove('open');
  modalImg.src = '';
}

modalCloseBtn.addEventListener('click', closeImageModal);
imageModal.addEventListener('click', closeImageModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && imageModal.classList.contains('open')) {
    closeImageModal();
  }
});

// Helper to get left prefix symbol
function getPrefixSymbol(prefixType, index) {
  if (prefixType === 'number') return `${index + 1}.`;
  if (prefixType === 'bullet') return '•';
  if (prefixType === 'asterisk') return '*';
  return '';
}

// Handle pasting a screenshot into a specific row
function handlePasteOnItem(e, item) {
  const clipboardItems = e.clipboardData?.items;
  if (!clipboardItems) return;

  for (const clipItem of clipboardItems) {
    if (clipItem.type.startsWith('image/')) {
      e.preventDefault();
      const file = clipItem.getAsFile();
      if (!file) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (!Array.isArray(item.images)) item.images = [];
        item.images.push(event.target.result);
        saveAppState();
        renderActiveList();
      };
      reader.readAsDataURL(file);
    }
  }
}

// Render Tab Bar
function renderTabs() {
  tabBar.innerHTML = '';

  appState.tabs.forEach((tab) => {
    const tabEl = document.createElement('div');
    tabEl.className = `tab-item ${tab.id === appState.activeTabId ? 'active' : ''}`;
    tabEl.title = 'Click to switch • Double-click title to rename';

    tabEl.addEventListener('click', () => {
      if (appState.activeTabId !== tab.id) {
        appState.activeTabId = tab.id;
        saveAppState();
        renderAll();
      }
    });

    const titleSpan = document.createElement('span');
    titleSpan.className = 'tab-title';
    titleSpan.textContent = tab.title;

    // Double-click tab title to rename inline
    titleSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'tab-rename-input';
      input.value = tab.title;

      const commitRename = () => {
        const trimmed = input.value.trim();
        if (trimmed) {
          tab.title = trimmed;
          saveAppState();
        }
        renderTabs();
      };

      input.addEventListener('blur', commitRename);
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') input.blur();
        if (ev.key === 'Escape') {
          input.value = tab.title;
          input.blur();
        }
      });

      tabEl.replaceChild(input, titleSpan);
      input.focus();
      input.select();
    });

    tabEl.appendChild(titleSpan);

    // Allow closing tab if more than one exists
    if (appState.tabs.length > 1) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close-btn';
      closeBtn.textContent = '×';
      closeBtn.title = 'Close list tab';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = appState.tabs.findIndex(t => t.id === tab.id);
        appState.tabs.splice(idx, 1);

        if (appState.activeTabId === tab.id) {
          const nextTab = appState.tabs[Math.max(0, idx - 1)];
          appState.activeTabId = nextTab.id;
        }
        saveAppState();
        renderAll();
      });
      tabEl.appendChild(closeBtn);
    }

    tabBar.appendChild(tabEl);
  });

  // "+" button to add a new list tab
  const addTabBtn = document.createElement('button');
  addTabBtn.className = 'add-tab-btn';
  addTabBtn.textContent = '+';
  addTabBtn.title = 'New list tab';
  addTabBtn.addEventListener('click', () => {
    const newTab = createDefaultTab('Untitled');
    appState.tabs.push(newTab);
    appState.activeTabId = newTab.id;
    saveAppState();
    renderAll();
  });

  tabBar.appendChild(addTabBtn);
}

// Render rows for the currently active tab
function renderActiveList() {
  const activeTab = getActiveTab();
  prefixSelect.value = activeTab.prefixType;
  listContainer.innerHTML = '';

  activeTab.items.forEach((item, index) => {
    if (!Array.isArray(item.images)) item.images = [];

    const row = document.createElement('div');
    row.className = `note-row ${item.checked ? 'dimmed' : ''}`;
    row.addEventListener('paste', (e) => handlePasteOnItem(e, item));

    // 1. Left Prefix Column
    const prefixCol = document.createElement('div');
    prefixCol.className = 'prefix-col';
    prefixCol.textContent = getPrefixSymbol(activeTab.prefixType, index);

    // 2. Middle Content Column
    const contentCol = document.createElement('div');
    contentCol.className = 'content-col';

    const textarea = document.createElement('textarea');
    textarea.className = 'note-input';
    textarea.placeholder = 'Type notes here or paste a screenshot (Ctrl+V)...';
    textarea.value = item.text;

    textarea.addEventListener('input', (e) => {
      item.text = e.target.value;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
      saveAppState();
    });

    contentCol.appendChild(textarea);

    // Thumbnails
    if (item.images.length > 0) {
      const attachmentsArea = document.createElement('div');
      attachmentsArea.className = 'attachments-area';

      item.images.forEach((imgSrc, imgIndex) => {
        const thumbWrapper = document.createElement('div');
        thumbWrapper.className = 'thumb-wrapper';

        const thumbImg = document.createElement('img');
        thumbImg.className = 'thumb-img';
        thumbImg.src = imgSrc;
        thumbImg.title = 'Click to view full size';
        thumbImg.addEventListener('click', () => openImageModal(imgSrc));

        const removeImgBtn = document.createElement('button');
        removeImgBtn.className = 'remove-img-btn';
        removeImgBtn.textContent = '×';
        removeImgBtn.title = 'Remove screenshot';
        removeImgBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          item.images.splice(imgIndex, 1);
          saveAppState();
          renderActiveList();
        });

        thumbWrapper.appendChild(thumbImg);
        thumbWrapper.appendChild(removeImgBtn);
        attachmentsArea.appendChild(thumbWrapper);
      });

      contentCol.appendChild(attachmentsArea);
    }

    // 3. Right Action Column (Checkbox + Delete)
    const actionCol = document.createElement('div');
    actionCol.className = 'action-col';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'note-checkbox';
    checkbox.checked = item.checked;
    checkbox.addEventListener('change', (e) => {
      item.checked = e.target.checked;
      row.classList.toggle('dimmed', item.checked);
      saveAppState();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete box';
    deleteBtn.addEventListener('click', () => {
      activeTab.items.splice(index, 1);
      saveAppState();
      renderActiveList();
    });

    actionCol.appendChild(checkbox);
    actionCol.appendChild(deleteBtn);

    row.appendChild(prefixCol);
    row.appendChild(contentCol);
    row.appendChild(actionCol);
    listContainer.appendChild(row);

    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  });
}

function renderAll() {
  applyTheme();
  renderTabs();
  renderActiveList();
}

// Top Controls Events
addBoxBtn.addEventListener('click', () => {
  const activeTab = getActiveTab();
  activeTab.items.push({
    id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    text: '',
    checked: false,
    images: []
  });
  saveAppState();
  renderActiveList();
  listContainer.scrollTop = listContainer.scrollHeight;
});

prefixSelect.addEventListener('change', (e) => {
  const activeTab = getActiveTab();
  activeTab.prefixType = e.target.value;
  saveAppState();
  renderActiveList();
});

themeToggleBtn.addEventListener('click', () => {
  appState.darkMode = !appState.darkMode;
  saveAppState();
  applyTheme();
});

// Save right before window closes as a safety net
window.addEventListener('beforeunload', () => {
  saveAppState();
});

// Boot
loadAppState();
renderAll();