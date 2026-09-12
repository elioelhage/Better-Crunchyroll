const STORAGE_KEY = 'betterCrunchyrollEnabled';
const VERSION = '0.2.41';
const KEYS = { shortcuts:'betterCrunchyrollShortcuts', autoSkipIntro:'betterCrunchyrollAutoSkipIntro', autoSkipRecap:'betterCrunchyrollAutoSkipRecap', autoSkipCredits:'betterCrunchyrollAutoSkipCredits', blurUpcoming:'betterCrunchyrollBlurUpcoming', hideUpcomingTitles:'betterCrunchyrollHideUpcomingTitles' };
const DEFAULTS = { shortcuts:{skip:'KeyS',next:'KeyN'}, autoSkipIntro:false, autoSkipRecap:false, autoSkipCredits:false, blurUpcoming:false, hideUpcomingTitles:false };

const popupElement=document.querySelector('.popup');
const toggleButton=document.getElementById('toggleButton');
const versionText=document.getElementById('versionText');
const logoImage=document.querySelector('.popup__logo');
const settingsButton=document.getElementById('settingsButton');
const mainHeader=document.getElementById('mainHeader');
const popupFooter=document.getElementById('popupFooter');
const mainView=document.getElementById('mainView');
const settingsView=document.getElementById('settingsView');
const backSettingsButton=document.getElementById('backSettingsButton');
const confirmButton=document.getElementById('confirmButton');
const shortcutButtons={skip:document.querySelector('[data-shortcut="skip"]'),next:document.querySelector('[data-shortcut="next"]')};
const shortcutLabels={skip:document.getElementById('shortcutSkip'),next:document.getElementById('shortcutNext')};
const settingButtons={autoSkipIntro:document.getElementById('autoSkipIntro'),autoSkipRecap:document.getElementById('autoSkipRecap'),autoSkipCredits:document.getElementById('autoSkipCredits'),blurUpcoming:document.getElementById('blurUpcoming'),hideUpcomingTitles:document.getElementById('hideUpcomingTitles')};
let activeShortcut=null;
let savedSettings=null;
let draftSettings=null;

function pretty(code){const names={KeyS:'S',KeyP:'P',KeyN:'N',Escape:'Esc',Space:'Space',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓'};return names[code]||code?.replace(/^Key/,'').replace(/^Digit/,'')||'—';}
function clone(v){return JSON.parse(JSON.stringify(v));}
function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function normalizeSettings(stored){const {previous:_ignoredPrevious,...storedShortcuts}=stored[KEYS.shortcuts]||{};return {shortcuts:{...DEFAULTS.shortcuts,...storedShortcuts},autoSkipIntro:Boolean(stored[KEYS.autoSkipIntro]),autoSkipRecap:Boolean(stored[KEYS.autoSkipRecap]),autoSkipCredits:Boolean(stored[KEYS.autoSkipCredits]),blurUpcoming:Boolean(stored[KEYS.blurUpcoming]),hideUpcomingTitles:Boolean(stored[KEYS.hideUpcomingTitles])};}
function renderEnabled(enabled){const on=enabled!==false;popupElement.dataset.enabled=String(on);logoImage.src=on?'icons/icon128.png':'icons/icon128-off.png';toggleButton.setAttribute('aria-checked',String(on));toggleButton.setAttribute('aria-label',on?'Disable Better Crunchyroll':'Enable Better Crunchyroll');}
function renderDraft(){for(const [id,button] of Object.entries(settingButtons))button.setAttribute('aria-checked',String(draftSettings[id]));for(const [key,label] of Object.entries(shortcutLabels))label.textContent=pretty(draftSettings.shortcuts[key]);confirmButton.disabled=equal(savedSettings,draftSettings);}
function loadIntoDraft(stored){savedSettings=normalizeSettings(stored);draftSettings=clone(savedSettings);renderDraft();}
async function load(){const stored=await chrome.storage.local.get({[STORAGE_KEY]:true,[KEYS.shortcuts]:DEFAULTS.shortcuts,[KEYS.autoSkipIntro]:false,[KEYS.autoSkipRecap]:false,[KEYS.autoSkipCredits]:false,[KEYS.blurUpcoming]:false,[KEYS.hideUpcomingTitles]:false});renderEnabled(stored[STORAGE_KEY]);loadIntoDraft(stored);versionText.textContent=`v${VERSION}`;}

toggleButton.addEventListener('click',async()=>{const current=toggleButton.getAttribute('aria-checked')==='true';await chrome.storage.local.set({[STORAGE_KEY]:!current});renderEnabled(!current);});
settingsButton.addEventListener('click',()=>{draftSettings=clone(savedSettings);activeShortcut=null;Object.values(shortcutButtons).forEach(b=>b.classList.remove('capturing'));mainView.hidden=true;mainHeader.hidden=true;settingsView.hidden=false;settingsView.scrollTop=0;popupFooter.hidden=true;popupElement.dataset.view='settings';renderDraft();});
backSettingsButton.addEventListener('click',()=>{activeShortcut=null;Object.values(shortcutButtons).forEach(b=>b.classList.remove('capturing'));draftSettings=clone(savedSettings);renderDraft();settingsView.hidden=true;mainView.hidden=false;mainHeader.hidden=false;popupFooter.hidden=false;popupElement.dataset.view='main';});
for(const [id] of Object.entries(settingButtons)){settingButtons[id].addEventListener('click',()=>{draftSettings[id]=!draftSettings[id];renderDraft();});}
for(const [name,button] of Object.entries(shortcutButtons)){button.addEventListener('click',()=>{activeShortcut=name;Object.values(shortcutButtons).forEach(b=>b.classList.remove('capturing'));button.classList.add('capturing');});}

document.addEventListener('keydown',event=>{if(!activeShortcut)return;event.preventDefault();event.stopPropagation();if(event.code==='Escape'){activeShortcut=null;Object.values(shortcutButtons).forEach(b=>b.classList.remove('capturing'));return;}if(event.ctrlKey||event.altKey||event.metaKey)return;draftSettings.shortcuts[activeShortcut]=event.code;renderDraft();Object.values(shortcutButtons).forEach(b=>b.classList.remove('capturing'));activeShortcut=null;},true);

confirmButton.addEventListener('click',async()=>{if(confirmButton.disabled)return;await chrome.storage.local.set({[KEYS.shortcuts]:draftSettings.shortcuts,[KEYS.autoSkipIntro]:draftSettings.autoSkipIntro,[KEYS.autoSkipRecap]:draftSettings.autoSkipRecap,[KEYS.autoSkipCredits]:draftSettings.autoSkipCredits,[KEYS.blurUpcoming]:draftSettings.blurUpcoming,[KEYS.hideUpcomingTitles]:draftSettings.hideUpcomingTitles});savedSettings=clone(draftSettings);confirmButton.disabled=true;try{const tabs=await chrome.tabs.query({active:true,currentWindow:true});const tab=tabs[0];if(tab?.id&&tab.url?.includes('crunchyroll.com'))await chrome.tabs.reload(tab.id);}catch(e){console.error('Better Crunchyroll settings reload failed',e);}});
chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(changes[STORAGE_KEY])renderEnabled(changes[STORAGE_KEY].newValue!==false);if(Object.values(KEYS).some(k=>changes[k])){chrome.storage.local.get({[KEYS.shortcuts]:DEFAULTS.shortcuts,[KEYS.autoSkipIntro]:false,[KEYS.autoSkipRecap]:false,[KEYS.autoSkipCredits]:false,[KEYS.blurUpcoming]:false,[KEYS.hideUpcomingTitles]:false}).then(stored=>{if(!equal(savedSettings,normalizeSettings(stored)))loadIntoDraft(stored);});}});
popupElement.dataset.view='main';load();
