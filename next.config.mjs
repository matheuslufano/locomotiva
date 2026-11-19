/** API remains in the existing Express backend. */
const backendUrl = process.env.LOCOMOTIVA_BACKEND_URL;
const isVercelBuild = process.env.VERCEL === "1";

if (isVercelBuild && !backendUrl) {
  throw new Error("Configure LOCOMOTIVA_BACKEND_URL com a URL HTTPS pública do afiliados-backend na Vercel.");
}

const config = {
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/*": [
      "./*.html", "./profile-placeholder.svg", "./assets/**/*",
      "./styles/**/*", "./components/**/*.html", "./scripts/landing/**/*.js",
      "./scripts/registration/**/*.js", "./scripts/shared/**/*.js",
    ],
  },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  turbopack: { root: process.cwd() },
  async rewrites() {
    return [{
      source: "/locomotiva/:path*",
      destination: (backendUrl || "http://127.0.0.1:3001").replace(/\/$/, "") + "/locomotiva/:path*",
    }];
  },
};
export default config;
