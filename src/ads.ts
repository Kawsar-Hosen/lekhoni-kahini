/**
 * Lekhoni Kahini - AdMob Service
 *
 * Handles App Open, Interstitial, and Rewarded ads.
 * Uses Google test Ad Unit IDs during development.
 * Dynamically imports native module — gracefully no-ops when unavailable.
 */

let mobileAds: any = null;
let AppOpenAd: any = null;
let InterstitialAd: any = null;
let RewardedAd: any = null;
let AdEventType: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = null;
let adsAvailable = false;

async function loadAdsModule(): Promise<boolean> {
  if (adsAvailable) return true;
  try {
    const mod = await import('react-native-google-mobile-ads');
    mobileAds = mod.default;
    AppOpenAd = mod.AppOpenAd;
    InterstitialAd = mod.InterstitialAd;
    RewardedAd = mod.RewardedAd;
    AdEventType = mod.AdEventType;
    RewardedAdEventType = mod.RewardedAdEventType;
    TestIds = mod.TestIds;
    adsAvailable = true;
    return true;
  } catch {
    adsAvailable = false;
    return false;
  }
}

const AD_CONFIG = {
  appOpenCooldownMs: 120_000,
  interstitialCooldownMs: 180_000,
  interstitialChapterInterval: 3,
  interstitialMaxPerSession: 5,
};

let appOpenAd: any = null;
let lastAppOpenShownAt = 0;
let appOpenReady = false;

function loadAppOpenAd(): void {
  if (!adsAvailable || !AppOpenAd || !TestIds) return;
  try {
    appOpenAd = AppOpenAd.createForAdRequest(TestIds.APP_OPEN, {
      requestNonPersonalizedAdsOnly: false,
    });
    appOpenAd.addAdEventListener(AdEventType.LOADED, () => { appOpenReady = true; });
    appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      appOpenReady = false;
      lastAppOpenShownAt = Date.now();
      setTimeout(loadAppOpenAd, 1000);
    });
    appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
      appOpenReady = false;
      setTimeout(loadAppOpenAd, 5000);
    });
    appOpenAd.load();
  } catch {}
}

export function showAppOpenAd(): void {
  if (!adsAvailable) return;
  try {
    const now = Date.now();
    if (now - lastAppOpenShownAt < AD_CONFIG.appOpenCooldownMs) return;
    if (!appOpenAd || !appOpenReady) return;
    lastAppOpenShownAt = now;
    appOpenAd.show();
  } catch {}
}

let interstitialAd: any = null;
let lastInterstitialShownAt = 0;
let interstitialSessionCount = 0;
let chaptersSinceLastInterstitial = 0;
let interstitialReady = false;

function loadInterstitialAd(): void {
  if (!adsAvailable || !InterstitialAd || !TestIds) return;
  try {
    interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
    });
    interstitialAd.addAdEventListener(AdEventType.LOADED, () => { interstitialReady = true; });
    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialReady = false;
      lastInterstitialShownAt = Date.now();
      interstitialSessionCount++;
      setTimeout(loadInterstitialAd, 1000);
    });
    interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      interstitialReady = false;
      setTimeout(loadInterstitialAd, 5000);
    });
    interstitialAd.load();
  } catch {}
}

export function maybeShowInterstitial(): boolean {
  if (!adsAvailable) return false;
  try {
    chaptersSinceLastInterstitial++;
    if (chaptersSinceLastInterstitial < AD_CONFIG.interstitialChapterInterval) return false;
    if (Date.now() - lastInterstitialShownAt < AD_CONFIG.interstitialCooldownMs) return false;
    if (interstitialSessionCount >= AD_CONFIG.interstitialMaxPerSession) return false;
    if (!interstitialAd || !interstitialReady) return false;
    chaptersSinceLastInterstitial = 0;
    interstitialAd.show();
    return true;
  } catch { return false; }
}

let rewardedAd: any = null;
let rewardedReady = false;
let pendingRewardCallback: (() => void) | null = null;

function loadRewardedAd(): void {
  if (!adsAvailable || !RewardedAd || !TestIds) return;
  try {
    rewardedAd = RewardedAd.createForAdRequest(TestIds.REWARDED, {
      requestNonPersonalizedAdsOnly: false,
    });
    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => { rewardedReady = true; });
    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      if (pendingRewardCallback) { pendingRewardCallback(); pendingRewardCallback = null; }
    });
    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedReady = false;
      pendingRewardCallback = null;
      setTimeout(loadRewardedAd, 1000);
    });
    rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
      rewardedReady = false;
      pendingRewardCallback = null;
      setTimeout(loadRewardedAd, 5000);
    });
    rewardedAd.load();
  } catch {}
}

export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!adsAvailable || !rewardedAd || !rewardedReady) { resolve(true); return; }
    try {
      pendingRewardCallback = () => resolve(true);
      rewardedAd.show();
    } catch { pendingRewardCallback = null; resolve(true); }
  });
}

export function isRewardedAdReady(): boolean { return adsAvailable && rewardedReady; }

export function resetAdSession(): void {
  interstitialSessionCount = 0;
  chaptersSinceLastInterstitial = 0;
}

// PDF download: show interstitial only once per session
let pdfAdShown = false;
export async function showPdfAd(): Promise<boolean> {
  if (!adsAvailable || pdfAdShown) return false;
  try {
    if (!interstitialAd || !interstitialReady) return false;
    pdfAdShown = true;
    interstitialAd.show();
    return true;
  } catch { return false; }
}
export function isPdfAdShown(): boolean { return pdfAdShown; }

export async function initAllAds(): Promise<void> {
  const ok = await loadAdsModule();
  if (!ok) return;
  try { mobileAds().initialize(); } catch {}
  try { loadAppOpenAd(); } catch {}
  try { loadInterstitialAd(); } catch {}
  try { loadRewardedAd(); } catch {}
}
