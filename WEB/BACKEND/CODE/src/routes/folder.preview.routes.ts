import { Router } from 'express';
import { FolderPreviewController } from '../controllers/folder.preview.controller'; 
import { AuthMiddleware } from '../middlewares/auth.middleware'; // Import the class
import  container  from '../di/inversify.config'; // Added import for DI container
import { TYPES } from '../di/types'; // Added import for DI types

const router = Router();
// Use dependency injection instead of direct instantiation
const folderPreviewController = container.get<FolderPreviewController>(TYPES.FolderPreviewController);
// Get AuthMiddleware from container
const authMiddleware = container.get<AuthMiddleware>(TYPES.AuthMiddleware);

// Route to clone a git repository into the temporary working directory
router.post('/clone/:repoName', authMiddleware.authenticate, folderPreviewController.cloneGitFolder);

// Route to get the content of a file or directory within the temporary working directory
router.get('/content', authMiddleware.authenticate, folderPreviewController.getPathContent);

// Route to modify the content of a file within the temporary working directory
router.put('/content', authMiddleware.authenticate, folderPreviewController.modifyFileContent);

// Route to create a new file or folder
// POST /item - Body: { "relativePath": "path/to/new", "type": "file" | "folder", "content"?: "..." }
router.post('/item', authMiddleware.authenticate, folderPreviewController.createItem);

// Route to remove a file or folder
// DELETE /item?relativePath=path/to/remove
router.delete('/item', authMiddleware.authenticate, folderPreviewController.removeItem);

// Route to rename/move a file or folder
// PATCH /item - Body: { "oldRelativePath": "path/old", "newRelativePath": "path/new" }
router.patch('/item', authMiddleware.authenticate, folderPreviewController.renameItem);

// Route to serve a raw file from within a repository in the temporary working directory
// The 'path' query parameter should be the full relative path within the user's 
// temporary working directory, including the repository name.
// e.g., GET /files?path=repoName/path/to/file.jpg
router.get('/files', authMiddleware.authenticate, folderPreviewController.serveFile);

// Add missing route for pushing changes to git repository
// POST /push/:repoName - Body: { "commitMessage"?: "..." }
router.post('/push/:repoName', authMiddleware.authenticate, folderPreviewController.pushGitFolder);

export default router;