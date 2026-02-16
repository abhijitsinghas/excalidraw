# GitHub Pages 404 Error Resolution

## Root Cause

The 404 error "There isn't a GitHub Pages site here" occurred because the custom domain (`excalidraw.abhijits.com`) was removed from the GitHub Pages settings in the repository.

When using a custom domain with GitHub Pages:

1. The custom domain must be configured in the repository's Pages settings
2. If this setting is removed or lost, GitHub Pages returns a 404 error even if the `gh-pages` branch exists with correct content

## Resolution

The custom domain `excalidraw.abhijits.com` has been re-added to the repository's GitHub Pages settings.

## How to Configure GitHub Pages with Custom Domain

### Step 1: Repository Settings

1. Go to your repository on GitHub (e.g., `https://github.com/abhijitsingh/excalidraw`)
2. Navigate to **Settings** → **Pages**
3. Under "Custom domain", enter your domain (e.g., `excalidraw.abhijits.com`)
4. Click **Save**
5. Wait for DNS propagation (can take a few minutes to several hours)

### Step 2: Verify DNS Configuration

If using a custom domain, ensure your DNS is properly configured:

- For APEX domains (e.g., `abhijits.com`), create an A record pointing to GitHub's IPs:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- For subdomains (e.g., `excalidraw.abhijits.com`), create a CNAME record pointing to `username.github.io`

### Step 3: Enable HTTPS (Recommended)

1. In the GitHub Pages settings, check "Enforce HTTPS"
2. This may take a few minutes to provision after initial setup

## Preventive Measures

1. **Don't remove custom domain settings** - Even if redeploying, the custom domain setting should be preserved
2. **Document the configuration** - Keep a note of your GitHub Pages settings
3. **Use GitHub Actions for deployment** - The `release.yml` workflow handles deployment automatically on push to master, ensuring the `gh-pages` branch is always up to date

## Alternative: Use GitHub Actions for Deployment

Instead of running `npm run deploy` locally, consider using the existing `release.yml` workflow which:

- Builds and deploys automatically on push to `master` branch
- Uses `peaceiris/actions-gh-pages@v3` for reliable deployment
- Handles the gh-pages branch management automatically

To trigger a deployment:

```bash
git push origin master
```

This will automatically trigger the GitHub Actions workflow which builds and deploys to the `gh-pages` branch.
