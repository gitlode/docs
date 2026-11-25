# Publish and recover the Pages site

The owner authorizes the first production launch. A maintainer runs the existing
[Documentation validation workflow](../../.github/workflows/docs.yml) manually on `main`.
PRs and pushes to `main` run read-only validation. Only the manual deploy job gets Pages and OIDC
write permissions and uses the `github-pages` environment.

## Before the first launch

1. Review the production changes, wait for the PR checks and squash merge into `main`.
   Record the **full main commit SHA** after the merge.
2. In [Settings → Pages](https://github.com/gitlode/docs/settings/pages), confirm the
   publishing source is **GitHub Actions** and the custom domain is empty. The expected
   site is `https://gitlode.github.io/docs/`.
3. The public GitHub API on 2026-11-19 showed the existing `github-pages` environment
   allowed the `main` branch only and listed no required reviewer. Recheck if those
   settings change. The owner can add reviewer protection if they want an additional
   approval for every deployment. Direct manual dispatch otherwise requires repository write access.

## Prepare, then publish

1. Open [Actions → Documentation validation](https://github.com/gitlode/docs/actions/workflows/docs.yml).
   Select **Run workflow**, branch **main**, and leave **publish_sha** blank. The run builds
   every configured edition, validates links, localization, loopback HTTP and search, then
   uploads only the combined static `dist/` as a Pages artifact for seven days.
2. Check that validation and upload succeeded and deployment was skipped. Read the **Verified
   Pages candidate** summary for the docs SHA, artifact name, edition refs, pins and counts.
   For a blocked upload, check the run log and repository or organization policy permitting
   `actions/upload-pages-artifact` and its dependency `actions/upload-artifact`.
3. After owner approval, run the workflow on **main** again and paste that full docs SHA
   into **publish_sha**. This run rebuilds and revalidates the approved inputs and deploys
   its own complete artifact. If main has moved, prepare and review the new SHA first.
   Wait for any configured environment approval and the deploy job. For a permission failure,
   check the environment branch rule, Pages source, and whether `actions/deploy-pages` is
   allowed. A repository-wide writable token or a personal token is unnecessary.
4. Keep the publish run URL, docs SHA, edition pins and hosted verification result in the
   release PR or release record. Mark a release known-good only after the hosted checks pass.
   For an example, see the [first verified deployment](../handoff/production-readiness.md#p5-deployment-verification-and-recovery).

## Verify the hosted release

Start at the deploy job's environment URL. Open the following directly over HTTPS and refresh:

- `/docs/` and every configured edition's English and Japanese home. Check the version switch
  preserves the language, the language switch preserves the document, and styling and scripts load.
- A nested page such as `/docs/stable/en/design/plugins/`. Follow a heading link and reload
  with its fragment. On a document page, compare its canonical link's commit with the run summary.
- A Japanese fallback page and the Japanese Profiling Guide. Compare the language and notices
  with the candidate. Search for `CLI` in each edition and locale, then open a result and check
  its page and fragment. Check the browser network panel for failed same-site asset requests.
- A nonexistent path and excluded paths such as `/docs/config/editions.json`,
  `/docs/.generated/preview.json` and `/docs/docs/handoff/current.md` should return HTTP 404.

## Recover a release

- **Build or upload failed:** Inspect the failing step, correct the inputs in a PR and prepare
  again. The deploy job depends on a successful candidate from that run.
- **Deployment or hosted checks failed:** Check the live site and the environment deployment
  history. Record the affected run and symptoms. For an earlier known-good publish run,
  choose **Re-run all jobs** on that run with owner authorization. GitHub reuses the original
  ref and docs SHA. The workflow reacquires its pins, rebuilds and validates all editions,
  and deploys an artifact named for the new attempt. Repeat all hosted checks. Coordinate
  with other maintainers so a queued manual publication does not immediately supersede recovery.
- **The old run cannot be rerun:** Use an ordinary recovery PR on main to restore the reviewed
  known-good source configuration, translations, lockfile and relevant site implementation
  from Git history. Confirm all pins can be acquired. Prepare and publish the resulting main
  SHA through the same workflow. If a pin cannot be fetched, stop and select a reviewed,
  reproducible recovery revision with the owner.
- **First launch, no known-good deployment:** Stop issuing publish runs. If the served site
  needs immediate withdrawal, an owner with admin or maintainer access can select **Unpublish
  site** in Settings → Pages. Correct the failure, prepare again and obtain approval for the
  next publish attempt. [GitHub's unpublish procedure](https://docs.github.com/en/pages/getting-started-with-github-pages/unpublishing-a-github-pages-site)
