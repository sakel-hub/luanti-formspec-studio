export type LocaleId = 'en' | 'sk' | 'de' | 'fr' | 'es' | 'ru';

export interface LocaleMeta {
  id: LocaleId;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { id: 'en', name: 'English', nativeName: 'English', flag: 'EN' },
  { id: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: 'SK' },
  { id: 'de', name: 'German', nativeName: 'Deutsch', flag: 'DE' },
  { id: 'fr', name: 'French', nativeName: 'Français', flag: 'FR' },
  { id: 'es', name: 'Spanish', nativeName: 'Español', flag: 'ES' },
  { id: 'ru', name: 'Russian', nativeName: 'Русский', flag: 'RU' },
];

export interface TranslationDictionary {
  common: {
    ok: string;
    cancel: string;
    close: string;
    save: string;
    saved: string;
    saving: string;
    copy: string;
    copied: string;
    download: string;
    search: string;
    delete: string;
    duplicate: string;
    open: string;
  };
  header: {
    title: string;
    versionBadge: string;
    projects: string;
    templates: string;
    snap: string;
    undo: string;
    redo: string;
    share: string;
    shortcuts: string;
    help: string;
    language: string;
    github: string;
    menu: string;
    jsonExport: string;
    playTest: string;
    stopTest: string;
    exportLua: string;
    backToCanvas: string;
    mobile: string;
    tablet: string;
    desktop: string;
    installApp: string;
    settings: string;
  };
  shortcuts: {
    title: string;
    subtitle: string;
    catCanvas: string;
    catEditing: string;
    catLayout: string;
    catProject: string;
  };
  help: {
    title: string;
    subtitle: string;
    tabBasics: string;
    tabWidgets: string;
    tabPrototype: string;
    tabExport: string;
  };
  share: {
    title: string;
    subtitle: string;
    copyLink: string;
    shareUrl: string;
    rawFormspec: string;
    discordTip: string;
  };
}

export type TranslationKey = string;
