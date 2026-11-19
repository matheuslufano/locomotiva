/** API remains in the existing Express backend. */
const config = {
  outputFileTracingIncludes: {
    "/campanha-locomotiva/[[...file]]": [
      "./*.html", "./profile-placeholder.svg", "./assets/**/*",
      "./styles/**/*", "./components/**/*.html",
      "./scripts/landing/**/*.js", "./scripts/registration/**/*.js", "./scripts/shared/**/*.js",
    ],
  },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  turbopack: { root: process.cwd() },
  async rewrites() {
    return [{
      source: "/locomotiva/:path*",
      destination: (process.env.LOCOMOTIVA_BACKEND_URL || "http://127.0.0.1:3001").replace(/\/$/, "") + "/locomotiva/:path*",
    }];
  },
};
export default config;
