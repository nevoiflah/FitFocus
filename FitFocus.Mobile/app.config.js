const appJson = require("./app.json");

const configuredApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  appJson.expo?.extra?.apiBaseUrl ||
  "";

module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiBaseUrl: configuredApiBaseUrl,
    },
  },
});
