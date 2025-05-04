import { Router, Request, Response } from 'express';
import container from '../di/inversify.config';
import { IssueController } from '../controllers/issue.controller';

const router = Router();
const issueController = container.get<IssueController>(IssueController);

// Global issue search (across all repositories)
// IMPORTANT: Place this before routes with parameters like /:issueId to avoid conflicts
router.get('/search', (req: Request, res: Response) => {
    issueController.findAllIssues(req, res);
});

// Repository issues
router.get('/repository/:repositoryId', (req: Request, res: Response) => {
    issueController.getRepositoryIssues(req, res);
});

// Search issues in repository
router.get('/repository/:repositoryId/search', (req: Request, res: Response) => {
    issueController.searchIssues(req, res);
});

// Get all comments for a repository's issues
router.get('/repository/:repositoryId/comments', (req: Request, res: Response) => {
    issueController.getRepositoryIssueComments(req, res);
});

// Individual issue operations
router.get('/:issueId', (req: Request, res: Response) => {
    issueController.getIssueById(req, res);
});

router.post('/', (req: Request, res: Response) => {
    issueController.createIssue(req, res);
});

router.put('/:issueId', (req: Request, res: Response) => {
    issueController.updateIssue(req, res);
});

router.delete('/:issueId', (req: Request, res: Response) => {
    issueController.deleteIssue(req, res);
});

// Issue comments
router.post('/comments', (req: Request, res: Response) => {
    issueController.addIssueComment(req, res);
});

// User issues
router.get('/user/:userId', (req: Request, res: Response) => {
    issueController.getUserIssues(req, res);
});

export default router;
