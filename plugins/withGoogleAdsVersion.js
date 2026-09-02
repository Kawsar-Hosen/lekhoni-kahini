const {
  withAppBuildGradle,
} = require("expo/config-plugins");

module.exports = function withGoogleAdsVersion(config) {
  return withAppBuildGradle(config, (cfg) => {
    const marker = "play-services-ads";
    if (!cfg.modResults.contents.includes(marker)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        "android {",
        `configurations.all {
    resolutionStrategy {
        force 'com.google.android.gms:play-services-ads:24.4.0'
    }
}

android {`
      );
    }
    return cfg;
  });
};
