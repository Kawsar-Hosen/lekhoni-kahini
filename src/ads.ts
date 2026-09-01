/**
 * Lekhoni Kahini - AdMob Service
 * 
 * Handles App Open, Interstitial, and Rewarded ads.
 * Uses Google test Ad Unit IDs during development.
 * 
 * NO Banner or Native ads are used.
 */

import {
  AppOpenAd,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// ============================================================
// CONFIGURATION — Change these when going to production
// ============================================================

const AD_CONFIG = {
  // Test IDs (Google official test ads — safe for development)
  appOpen: TestIds.APP_OPEN,
  interstitial: TestIds.INTERSTITIAL,
  rewarded: TestIds.REWARDED,

  // Cooldowns & frequency
  appOpenCooldownMs: 120_000,        // 2 min between App Open ads
  interstitialCooldownMs: 180_000,   // 3 min between Interstitial ads
  interstitialChapterInterval: 3,    // Show interstitial every N chapters
  interstitialMaxPerSession: 5,      // Max interstitial ads per session
};

// ============================================================
// APP OPEN AD
// ============================================================

let appOpenAd: AppOpenAd | null = null;
let lastAppOpenShownAt = 0;
let appOpenReady = false;

function loadAppOpenAd(): void {
  try {
    appOpenAd = AppOpenAd.createForAdRequest(AD_CONFIG.appOpen, {
      requestNonPersonalizedAdsOnly: false,
    });

    appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      appOpenReady = true;
    });

    appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      appOpenReady = false;
      lastAppOpenShownAt = Date.now();
      // Pre-load next ad
      setTimeout(loadAppOpenAd, 1000);
    });

    appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
      appOpenReady = false;
      // Retry after delay
      setTimeout(loadAppOpenAd, 5000);
    });

    appOpenAd.load();
  } catch {
    // Silently fail — app must not crash
  }
}

/**
 * Show App Open Ad on app launch or resume.
 * Respects cooldown. Never blocks the app.
 */
export function showAppOpenAd(): void {
  try {
    const now = Date.now();
    if (now - lastAppOpenShownAt < AD_CONFIG.appOpenCooldownMs) return;
    if (!appOpenAd || !appOpenReady) return;

    lastAppOpenShownAt = now;
    appOpenAd.show();
  } catch {
    // Never block app usage
  }
}

/**
 * Initialize App Open Ad system. Call once on app mount.
 */
export function initAppOpenAd(): void {
  loadAppOpenAd();
}

// ============================================================
// INTERSTITIAL AD
// ============================================================

let interstitialAd: InterstitialAd | null = null;
let lastInterstitialShownAt = 0;
let interstitialSessionCount = 0;
let chaptersSinceLastInterstitial = 0;
let interstitialReady = false;

function loadInterstitialAd(): void {
  try {
    interstitialAd = InterstitialAd.createForAdRequest(AD_CONFIG.interstitial, {
      requestNonPersonalizedAdsOnly: false,
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      interstitialReady = true;
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialReady = false;
      lastInterstitialShownAt = Date.now();
      interstitialSessionCount++;
      // Pre-load next
      setTimeout(loadInterstitialAd, 1000);
    });

    interstitialAd.addAdEventListener(AdEventType.ERROR, () => {
      interstitialReady = false;
      setTimeout(loadInterstitialAd, 5000);
    });

    interstitialAd.load();
  } catch {
    // Silently fail
  }
}

/**
 * Call when user opens a chapter/episode.
 * Returns true if ad was shown (meaning the caller should delay navigation).
 * Returns false if no ad shown (proceed normally).
 */
export function maybeShowInterstitial(): boolean {
  try {
    chaptersSinceLastInterstitial++;

    // Don't show if:
    // - Not enough chapters since last ad
    // - Cooldown not passed
    // - Max session limit reached
    // - Ad not ready
    if (chaptersSinceLastInterstitial < AD_CONFIG.interstitialChapterInterval) return false;
    if (Date.now() - lastInterstitialShownAt < AD_CONFIG.interstitialCooldownMs) return false;
    if (interstitialSessionCount >= AD_CONFIG.interstitialMaxPerSession) return false;
    if (!interstitialAd || !interstitialReady) return false;

    chaptersSinceLastInterstitial = 0;
    interstitialAd.show();
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize Interstitial Ad system. Call once on app mount.
 */
export function initInterstitialAd(): void {
  loadInterstitialAd();
}

// ============================================================
// REWARDED AD
// ============================================================

let rewardedAd: RewardedAd | null = null;
let rewardedReady = false;
let pendingRewardCallback: (() => void) | null = null;

function loadRewardedAd(): void {
  try {
    rewardedAd = RewardedAd.createForAdRequest(AD_CONFIG.rewarded, {
      requestNonPersonalizedAdsOnly: false,
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedReady = true;
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      // Reward earned — unlock content
      if (pendingRewardCallback) {
        pendingRewardCallback();
        pendingRewardCallback = null;
      }
    });

    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedReady = false;
      pendingRewardCallback = null;
      // Pre-load next
      setTimeout(loadRewardedAd, 1000);
    });

    rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
      rewardedReady = false;
      pendingRewardCallback = null;
      setTimeout(loadRewardedAd, 5000);
    });

    rewardedAd.load();
  } catch {
    // Silently fail
  }
}

/**
 * Show Rewarded Ad. Returns a promise that resolves to true if reward earned.
 * Use for "Watch Ad to Unlock" feature.
 */
export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (!rewardedAd || !rewardedReady) {
        resolve(false);
        return;
      }

      pendingRewardCallback = () => resolve(true);
      rewardedAd.show();
    } catch {
      pendingRewardCallback = null;
      resolve(false);
    }
  });
}

/**
 * Check if Rewarded Ad is available.
 */
export function isRewardedAdReady(): boolean {
  return rewardedReady;
}

/**
 * Initialize Rewarded Ad system. Call once on app mount.
 */
export function initRewardedAd(): void {
  loadRewardedAd();
}

// ============================================================
// GLOBAL INIT
// ============================================================

/**
 * Initialize all ad systems. Call once when app mounts.
 */
export function initAllAds(): void {
  initAppOpenAd();
  initInterstitialAd();
  initRewardedAd();
}

/**
 * Reset session counters. Call if needed (e.g., on logout).
 */
export function resetAdSession(): void {
  interstitialSessionCount = 0;
  chaptersSinceLastInterstitial = 0;
}
