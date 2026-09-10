const STORAGE_KEY='betterCrunchyrollEnabled';
const VERSION='0.2.37';
chrome.runtime.onInstalled.addListener(async()=>{const stored=await chrome.storage.local.get(STORAGE_KEY);if(!(STORAGE_KEY in stored))await chrome.storage.local.set({[STORAGE_KEY]:true});await syncBadge()});
chrome.runtime.onStartup.addListener(syncBadge);
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes[STORAGE_KEY])syncBadge()});
async function syncBadge(){const stored=await chrome.storage.local.get({[STORAGE_KEY]:true});const enabled=stored[STORAGE_KEY]!==false;await chrome.action.setIcon({path:{16:enabled?'icons/icon128.png':'icons/icon128-off.png',32:enabled?'icons/icon128.png':'icons/icon128-off.png',48:enabled?'icons/icon128.png':'icons/icon128-off.png',128:enabled?'icons/icon128.png':'icons/icon128-off.png'}})}
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{if(message?.type==='PING'){chrome.storage.local.get({[STORAGE_KEY]:true}).then(stored=>{const enabled=stored[STORAGE_KEY]!==false;sendResponse({message:`Better Crunchyroll ${VERSION} is active.`,version:VERSION,enabled})});return true}return false});
