import { Router } from 'express';
import container from '../di/inversify.config';
import { TYPES } from '../di/types';

import { FolderPreviewController } from '../controllers/folder.preview.controller';
import { AuthMiddleware } from '../middlewares/auth.middleware';

/**
 * Factory that returns a fresh router for “folder preview” features.
 * All controller/middleware instances are resolved through Inversify
 * (and therefore auto‑traced by the proxy middleware you added earlier).
 */
export const folderPreviewRoutes = (): Router => {
  const router = Router();

  const ctrl  = container.get<FolderPreviewController>(TYPES.FolderPreviewController);
  const auth  = container.get<AuthMiddleware>(TYPES.AuthMiddleware);

  /* ───────── Git‑folder preview endpoints ───────── */

  // Clone a Git repo into the temp working directory
  router.post(
    '/clone/:repoName',
    auth.authenticate.bind(auth),
    ctrl.cloneGitFolder.bind(ctrl),
  );

  // Read file or directory contents
  router.get(
    '/content',
    auth.authenticate.bind(auth),
    ctrl.getPathContent.bind(ctrl),
  );

  // Modify file content
  router.put(
    '/content',
    auth.authenticate.bind(auth),
    ctrl.modifyFileContent.bind(ctrl),
  );

  // Create a new file or folder
  router.post(
    '/item',
    auth.authenticate.bind(auth),
    ctrl.createItem.bind(ctrl),
  );

  // Remove a file or folder
  router.delete(
    '/item',
    auth.authenticate.bind(auth),
    ctrl.removeItem.bind(ctrl),
  );

  // Rename/move a file or folder
  router.patch(
    '/item',
    auth.authenticate.bind(auth),
    ctrl.renameItem.bind(ctrl),
  );

  // Serve raw file bytes out of the temp repo
  router.get(
    '/files',
    auth.authenticate.bind(auth),
    ctrl.serveFile.bind(ctrl),
  );

  // Push local changes back to the Git remote
  router.post(
    '/push/:repoName',
    auth.authenticate.bind(auth),
    ctrl.pushGitFolder.bind(ctrl),
  );

  return router;
};

/* default export keeps “import folderPreviewRoutes from …” working */
export default folderPreviewRoutes;
