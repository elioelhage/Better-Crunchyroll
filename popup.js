const STORAGE_KEY='betterCrunchyrollEnabled';
const VERSION='0.2.23';
const KEYS={shortcuts:'betterCrunchyrollShortcuts',autoSkipIntro:'betterCrunchyrollAutoSkipIntro',autoSkipRecap:'betterCrunchyrollAutoSkipRecap',autoSkipCredits:'betterCrunchyrollAutoSkipCredits',blurUpcoming:'betterCrunchyrollBlurUpcoming',hideUpcomingTitles:'betterCrunchyrollHideUpcomingTitles'};
const DEFAULTS={shortcuts:{skip:'KeyS',previous:'KeyP',next:'KeyN'},autoSkipIntro:false,autoSkipRecap:false,autoSkipCredits:false,blurUpcoming:false,hideUpcomingTitles:false};
const popupElement=document.querySelector('.popup');
const toggleButton=document.getElementById('toggleButton');
const versionText=document.getElementById('versionText');
const logoImage=document.querySelector('.popup__logo');
const settingsButton=document.getElementById('settingsButton');
const mainView=document.getElementById('mainView');
const settingsView=document.getElementById('settingsView');
const backSettingsButton=document.getElementById('backSettingsButton');
const confirmButton=document.getElementById('confirmButton');
const captureHint=document.getElementById('captureHint');
const shortcutButtons={skip:document.querySelector('[data-shortcut="skip"]'),previous:document.querySelector('[data-shortcut="previous"]'),next:document.querySelector('[data-shortcut="next"]')};
const shortcutLabels={skip:document.getElementById('shortcutSkip'),previous:document.getElementById('shortcutPrevious'),next:document.getElementById('shortcutNext')};
const settingButtons={autoSkipIntro:document.getElementById('autoSkipIntro'),autoSkipRecap:document.getElementById('autoSkipRecap'),autoSkipCredits:document.getElementById('autoSkipCredits'),blurUpcoming:document.getElementById('blurUpcoming'),hideUpcomingTitles:document.getElementById('hideUpcomingTitles')};
let activeShortcut=null,savedSettings=null,draftSettings=null;
function pretty(code){const n={KeyS:'S',KeyP:'P',KeyN:'N',Escape:'Esc',Space:'Space',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓'};return n[code]||code?.replace(/^Key/,'').replace(/^Digit/,'')||'—';}
function clone(v){return JSON.parse(JSON.stringify(v));}
function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function normalizeSettings(stored){return{shortcuts:{...DEFAULTS.shortcuts,...(stored[KEYS.shortcuts]||{})},autoSkipIntro:Boolean(stored[KEYS.autoSkipIntro]),autoSkipRecap:Boolean(stored[KEYS.autoSkipRecap]),autoSkipCredits:Boolean(stored[KEYS.autoSkipCredits]),blurUpcoming:Boolean(stored[KEYS.blurUpcoming]),hideUpcomingTitles:Boolean(stored[KEYS.hideUpcomingTitles])};}
function renderEnabled(enabled){const on=enabled!==false;popupElement.dataset.enabled=String(on);logoImage.src=on?'icons/icon128.png':'icons/icon128-off.png';toggleButton.setAttribute('aria-checked',String(on));toggleButton.setAttribute('aria-label',on?'Disable Better Crunchyroll':'Enable Better Crunchyroll');}
function renderDraft(){for(const[id,b]of Object.entries(settingButtons))b.setAttribute('aria-checked',String(draftSettings[id]));for(const[k,l]of Object.entries(shortcutLabels))l.textContent=pretty(draftSettings.shortcuts[k]);confirmButton.disabled=equal(savedSettings,draftSettings);}
function resetDraft(){draftSettings=clone(savedSettings);activeShortcut=null;captureHint.hidden=true;Object.values(shortcutButtons).forEach(b=>b.classList.remove('capturing'));renderDraft();}
async function load(){const stored=await chrome.storage.local.get({[STORAGE_KEY]:true,[KEYS.shortcuts]:DEFAULTS.shortcuts,[KEYS.autoSkipIntro]:false,[KEYS.autoSkipRecap]:false,[KEYS.autoSkipCredits]:false,[KEYS.blurUpcoming]:false,[KEYS.hideUpcomingTitles]:false});renderEnabled(stored[STORAGE_KEY]);savedSettings=normalizeSettings(stored);resetDraft();versionText.textContent=`v${VERSION}`;}
toggleButton.addEventListener('click',async()=>{const current=toggleButton.getAttribute('aria-checked')==='true';await chrome.storage.local.set({[STORAGE_KEY]:!current});renderEnabled(!current);});
settingsButton.addEventListener('click',()=>{resetDraft();mainView.hidden=true;settingsView.hidden=false;});
backSettingsButton.addEventListener('click',()=>{resetDraft();settingsView.hidden=true;mainView.hidden=false;});
for(const[id,b]of Object.entries(settingButtons))b.addEventListener('click',()=>{draftSettings[id]=!draftSettings[id];renderDraft();});
for(const[name,b]of Object.entries(shortcutButtons))b.addEventListener('click',()=>{activeShortcut=name;captureHint.hidden=false;Object.values(shortcutButtons).forEach(x=>x.classList.remove('capturing'));b.classList.add('capturing');});
document.addEventListener('keydown',e=>{if(!activeShortcut)return;e.preventDefault();e.stopPropagation();if(e.code==='Escape'){activeShortcut=null;captureHint.hidden=true;Object.values(shortcutButtons).forEach(b=>b.classList.remove('capturing'));return;}if(e.ctrlKey||e.altKey||e.metaKey||e.key==='Tab')return;draftSettings.shortcuts[activeShortcut]=e.code;renderDraft();Object.values(shortcutButtons).forEach(b=>b.classList.remove('capturing'));activeShortcut=null;captureHint.hidden=true;},true);
confirmButton.addEventListener('click',async()=>{if(confirmButton.disabled)return;const d=clone(draftSettings);await chrome.storage.local.set({[KEYS.shortcuts]:d.shortcuts,[KEYS.autoSkipIntro]:d.autoSkipIntro,[KEYS.autoSkipRecap]:d.autoSkipRecap,[KEYS.autoSkipCredits]:d.autoSkipCredits,[KEYS.blurUpcoming]:d.blurUpcoming,[KEYS.hideUpcomingTitles]:d.hideUpcomingTitles});savedSettings=d;renderDraft();try{const tabs=await chrome.tabs.query({active:true,currentWindow:true});const tab=tabs[0];if(tab?.id&&tab.url?.includes('crunchyroll.com'))await chrome.tabs.reload(tab.id);}catch(err){console.error('Better Crunchyroll reload failed',err);}});
chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(changes[STORAGE_KEY])renderEnabled(changes[STORAGE_KEY].newValue!==false);if(Object.values(KEYS).some(k=>changes[k])&&!settingsView.hidden){load();}});
load();
