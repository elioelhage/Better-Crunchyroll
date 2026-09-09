const STORAGE_KEY = 'betterCrunchyrollEnabled';
const VERSION = '0.2.10';

const popupElement = document.querySelector('.popup');
const toggleButton = document.getElementById('toggleButton');
const versionText = document.getElementById('versionText');

function render(enabled) {
  const isEnabled = enabled !== false;

  popupElement.dataset.enabled = String(isEnabled);
  toggleButton.setAttribute('aria-checked', String(isEnabled));
  toggleButton.setAttribute(
    'aria-label',
    isEnabled ? 'Disable Better Crunchyroll' : 'Enable Better Crunchyroll',
  );
  versionText.textContent = `v${VERSION.replace(/^v/i, '')}`;
}

async function readState() {
  const stored = await chrome.storage.local.get({ [STORAGE_KEY]: true });
  render(stored[STORAGE_KEY]);
}

toggleButton.addEventListener('click', async () => {
  const currentEnabled = toggleButton.getAttribute('aria-checked') === 'true';
  const nextEnabled = !currentEnabled;

  await chrome.storage.local.set({ [STORAGE_KEY]: nextEnabled });
  render(nextEnabled);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[STORAGE_KEY]) {
    render(changes[STORAGE_KEY].newValue !== false);
  }
});

versionText.textContent = `v${VERSION.replace(/^v/i, '')}`;
readState();
