import { Router } from 'express';

/* Per‑domain route factories */
import configureUserRoutes         from './user.routes';
import authenticationRoutes        from './authentication.routes';
// import configureGitRoutes       from './git.routes';   // keep commented if unused
import configureRepositoryRoutes   from './repository.routes';
import folderPreviewRoutes         from './folder.preview.routes';
import configurePullRequestRoutes  from './pullRequest.routes';
import issueRoutes                 from './issue.routes';
import twoFactorAuthRoutes         from './2fa.routes';
import adminRoutes                 from './admin.routes';
import repositoryAccessRoutes      from './repository_access.routes';   // optional

/**
 * Builds the top‑level API router.  
 * Every child router is invoked as a **factory** (note the `()`),
 * so each call gets its own fresh Router and all controller instances
 * are resolved through Inversify → automatically proxied for tracing.
 */
export const configureRoutes = (): Router => {
  const router = Router();

  /* ───────── Domain routers ───────── */
  router.use('/users',          configureUserRoutes());
  // router.use('/git',         configureGitRoutes());

  router.use('',                authenticationRoutes());     // base path = ''
  router.use('/repositories',   configureRepositoryRoutes());
  router.use('/preview',        folderPreviewRoutes());       // repo file‑preview
  router.use('/pull-requests',  configurePullRequestRoutes());
  router.use('/issues',         issueRoutes());
  router.use('/2fa',            twoFactorAuthRoutes());
  router.use('/admin',          adminRoutes());
  router.use('/access',         repositoryAccessRoutes());    // repo‑access mgmt

  return router;
};

/* default export keeps existing imports working */
export default configureRoutes;
