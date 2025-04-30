import { Router } from 'express';
import { FolderPreviewController } from '../controllers/folder.preview';

const router = Router();
const folderPreviewController = new FolderPreviewController();

// Route to clone a git repository into the temporary working directory
router.post('/clone/:repoName', folderPreviewController.cloneGitFolder.bind(folderPreviewController));

// Route to get the content of a file or directory within the temporary working directory
router.get('/content', folderPreviewController.getPathContent.bind(folderPreviewController));

// Route to modify the content of a file within the temporary working directory
router.put('/modify', folderPreviewController.modifyFileContent.bind(folderPreviewController));

export default router;
