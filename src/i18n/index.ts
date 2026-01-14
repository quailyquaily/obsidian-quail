import en from './lang/en.json'
import ja from './lang/ja.json'
import zh from './lang/zh.json'
import zhTw from './lang/zh-tw.json'

const supportedLangs = [
  'en', 'ja', 'zh', 'zh-tw',
];

export const messages:any = {
  en, ja, zh, 'zh-tw': zhTw,
}

function detectLang() {
  let lang = window.localStorage.getItem('language');
  if (lang && supportedLangs.includes(lang)) {
    return lang
  }

  lang = navigator.language.toLowerCase();
  if (lang.length > 5) {
    lang = lang.substring(0, 5);
  }

  if (lang && supportedLangs.includes(lang)) {
    return lang
  } else {
    return 'en'
  }
}

function _t(lang: string, name: string, data?: Record<string, string>) {
  const locale = messages[lang];
  let msg = "";

  if (locale) {
    msg = locale[name];
    if (typeof msg === "undefined") {
      msg = messages.en[name];
      if (typeof msg === "undefined") {
        msg = name;
      }
    }
  }

  if (data) {
    for (const key in data) {
      const value = String(data[key]);
      msg = msg.split(`{${key}}`).join(value);
    }
  }

  return msg;
}

function t(name: string, data?: Record<string, string>) {
  const lang = detectLang();
  return _t(lang, name, data);
}

function english(name: string, data?: Record<string, string>) {
  // always return english
  return _t('en', name, data);
}

export {
  t,
  detectLang,
  english,
}
