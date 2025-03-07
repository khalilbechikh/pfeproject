import { Request, Response, NextFunction } from 'express';
import { createBareRepo } from '../git/initGitRepo';

/**
 * Controller to create a bare Git repository.
 */
export const CreateRepo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const repoName: string = req.params.RepoName;

    if (!repoName) {
        res.status(400).json({ error: "Repository name is required." });
        return;
    }

    try {
        await createBareRepo(repoName);
        res.status(201).json({ message: `Repository '${repoName}' created successfully.` });
    } catch (error) {
        next(error); // Pass errors explicitly to Express error handler
    }
};
