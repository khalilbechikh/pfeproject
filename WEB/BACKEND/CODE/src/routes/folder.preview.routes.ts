import { Router } from 'express';
import { FolderPreviewController } from '../controllers/folder.preview';
import { authenticateJWT } from '../middlewares/auth.middleware'; // Import the middleware

const router = Router();
const folderPreviewController = new FolderPreviewController();

// Route to clone a git repository into the temporary working directory
router.post('/clone/:repoName', authenticateJWT, folderPreviewController.cloneGitFolder.bind(folderPreviewController));

// Route to get the content of a file or directory within the temporary working directory
router.get('/content', authenticateJWT, folderPreviewController.getPathContent.bind(folderPreviewController));

// Route to modify the content of a file within the temporary working directory
// Note: This was previously '/modify', changed to '/item/content' for consistency
router.put('/item/content', authenticateJWT, folderPreviewController.modifyFileContent.bind(folderPreviewController));

// Route to create a new file or folder
// POST /item - Body: { "relativePath": "path/to/new", "type": "file" | "folder", "content"?: "..." }
router.post('/item', authenticateJWT, folderPreviewController.createItem.bind(folderPreviewController));

// Route to remove a file or folder
// DELETE /item?relativePath=path/to/remove
router.delete('/item', authenticateJWT, folderPreviewController.removeItem.bind(folderPreviewController));

// Route to rename/move a file or folder
// PUT /item/rename - Body: { "oldRelativePath": "path/old", "newRelativePath": "path/new" }
router.put('/item/rename', authenticateJWT, folderPreviewController.renameItem.bind(folderPreviewController)); // Fixed missing parenthesis

export default router;