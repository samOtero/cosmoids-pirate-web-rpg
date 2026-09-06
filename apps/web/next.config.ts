import { execFileSync } from 'node:child_process';
import type { NextConfig } from 'next';

function getBuildBranch(): string {
  const environmentBranch =
    process.env.NEXT_PUBLIC_COSMOIDS_BUILD_BRANCH ||
    process.env.CF_PAGES_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    process.env.GITHUB_REF_NAME ||
    process.env.BRANCH_NAME;

  if (environmentBranch) return environmentBranch;

  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

const nextConfig: NextConfig = {
  output: 'export',
  env: {
    NEXT_PUBLIC_COSMOIDS_BUILD_BRANCH: getBuildBranch(),
    NEXT_PUBLIC_COSMOIDS_BUILD_VERSION:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.CF_PAGES_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      process.env.npm_package_version ||
      '0.1.0',
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
