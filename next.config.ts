import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./app/i18n/request.ts");

const nextConfig: NextConfig = {
  basePath: "/nexus",
  output: "standalone",
  devIndicators: false,
};

export default withNextIntl(nextConfig);
