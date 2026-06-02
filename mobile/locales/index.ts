// English Imports
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enSettings from '@/locales/en/settings.json';
import enOnboarding from '@/locales/en/onboarding.json';
import enTabs from '@/locales/en/tabs.json';
import enSuperwall from '@/locales/en/superwall.json';
import enAccount from '@/locales/en/account.json';
// German Imports
import deCommon from '@/locales/de/common.json';
import deAuth from '@/locales/de/auth.json';
import deSettings from '@/locales/de/settings.json';
import deOnboarding from '@/locales/de/onboarding.json';
import deTabs from '@/locales/de/tabs.json';
import deSuperwall from '@/locales/de/superwall.json';
import deAccount from '@/locales/de/account.json';

// Arabic Imports
import arCommon from '@/locales/ar/common.json';
import arAuth from '@/locales/ar/auth.json';
import arSettings from '@/locales/ar/settings.json';
import arOnboarding from '@/locales/ar/onboarding.json';
import arTabs from '@/locales/ar/tabs.json';
import arSuperwall from '@/locales/ar/superwall.json';

export const defaultNS = 'common';

export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    settings: enSettings,
    onboarding: enOnboarding,
    tabs: enTabs,
    superwall: enSuperwall,
    account: enAccount,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    settings: deSettings,
    onboarding: deOnboarding,
    tabs: deTabs,
    superwall: deSuperwall,
    account: deAccount,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    settings: arSettings,
    onboarding: arOnboarding,
    tabs: arTabs,
    superwall: arSuperwall,
  },
} as const;

export type Language = keyof typeof resources;
export type Namespace = keyof typeof resources.en;
