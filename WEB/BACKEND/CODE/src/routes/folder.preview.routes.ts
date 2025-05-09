import { Router } from 'express';
import { FolderPreviewController } from '../controllers/folder.preview.controller'; 
import { authenticateJWT } from '../middlewares/auth.middleware'; 
import  container  from '../di/inversify.config'; // Added import for DI container
import { TYPES } from '../di/types'; // Added import for DI types

const router = Router();
// Use dependency injection instead of direct instantiation
const folderPreviewController = container.get<FolderPreviewController>(TYPES.FolderPreviewController);

// Route to clone a git repository into the temporary working directory
router.post('/clone/:repoName', authenticateJWT, folderPreviewController.cloneGitFolder);

// Route to get the content of a file or directory within the temporary working directory
router.get('/content', authenticateJWT, folderPreviewController.getPathContent);

// Route to modify the content of a file within the temporary working directory
router.put('/content', authenticateJWT, folderPreviewController.modifyFileContent);

// Route to create a new file or folder
// POST /item - Body: { "relativePath": "path/to/new", "type": "file" | "folder", "content"?: "..." }
router.post('/item', authenticateJWT, folderPreviewController.createItem);

// Route to remove a file or folder
// DELETE /item?relativePath=path/to/remove
router.delete('/item', authenticateJWT, folderPreviewController.removeItem);

// Route to rename/move a file or folder
// PATCH /item - Body: { "oldRelativePath": "path/old", "newRelativePath": "path/new" }
router.patch('/item', authenticateJWT, folderPreviewController.renameItem);

// Route to serve a raw file from within a repository in the temporary working directory
// GET /files/:repoName?path=path/to/file.jpg
router.get('/files/:repoName', authenticateJWT, folderPreviewController.serveFile);

// Add missing route for pushing changes to git repository
// POST /push/:repoName - Body: { "commitMessage"?: "..." }
router.post('/push/:repoName', authenticateJWT, folderPreviewController.pushGitFolder);

export default router;