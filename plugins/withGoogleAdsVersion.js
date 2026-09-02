const {
  withProjectBuildGradle,
} = require("expo/config-plugins");

module.exports = function withGoogleAdsVersion(config) {
  return withProjectBuildGradle(config, (cfg) => {
    const marker = "play-services-ads";
    if (!cfg.modResults.contents.includes(marker)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        "allprojects",
        `allprojects {
    configurations.all {
        resolutionStrategy {
            force 'com.google.android.gms:play-services-ads:24.4.0'
        }
    }
}`
      );
      if (!cfg.modResults.contents.includes(marker)) {
        cfg.modResults.contents = `buildscript {
    configurations.all {
        resolutionStrategy {
            force 'com.google.android.gms:play-services-ads:24.4.0'
        }
    }
}
` + cfg.modResults.contents;
      }
    }
    return cfg;
  });
};
