# GitHub Pages deployment

The main site is built from `apps/web`, not the legacy root `index.html`. The legacy file remains in the repository, but is not included in the Pages artifact. The site is published at the repository's Pages root; Vite's relative base supports the `/accounting-universe/` project path.

## One-time setup

1. Merge the deployment workflow into `main`.
2. In the repository's **Settings → Pages → Build and deployment → Source**, select **GitHub Actions** (not “Deploy from a branch”). This avoids the old Jekyll build and publishes the Vite artifact instead.
3. In **Actions**, check the **Deploy web app to GitHub Pages** run after the merge. If it ran before the Pages setting was changed or no run was triggered, use **Run workflow** on `main`. Wait for the deployment job to succeed before checking the site.

The workflow runs `npm ci`, typechecks and tests, builds the web app, and uploads only `apps/web/dist`. Subsequent pushes to `main` deploy automatically. A build or test failure prevents deployment. To roll back, revert the relevant change on `main` and allow the workflow to deploy again.

Replacing the legacy app does not migrate its session data to the new app. The new app stores its own progress on the device. The AI tutor proxy is not deployed by this workflow.
