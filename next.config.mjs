/** @type {import('next').NextConfig} */
const nextConfig = {
  // FlowDesk is a fully authenticated app: every page reads the Supabase
  // session cookie, so there is no static shell worth prerendering.
  // Cache Components (PPR) is disabled to keep rendering plainly dynamic and
  // predictable; data freshness is handled with revalidatePath after actions.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
