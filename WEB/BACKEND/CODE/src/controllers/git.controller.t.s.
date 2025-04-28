import { Request, Response, NextFunction } from 'express';
import { createRepository } from '../git/index';

/**
 * Controller to create a bare Git repository.
 */
export const CreateRepo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log('=== GIT CONTROLLER START ===');
    console.log('Request body:', JSON.stringify(req.body));
    console.log('Request params:', JSON.stringify(req.params));
    
    const repoName: string = req.params.RepoName;
    console.log('Repository name from params:', repoName);
    
    if (!repoName) {
        console.log('No repository name provided in parameters');
        res.status(400).json({ error: "Repository name is required." });
        return;
    }
    
    // Get the userId from the authenticated user
    console.log('User object from request:', JSON.stringify(req.user));
    const userId = parseInt(req.user?.userId || '0');
    const username = req.user?.email?.split('@')[0] || `user_${userId}`;
    
    console.log('Parsed user information - userId:', userId, 'username:', username);
    
    if (!username || userId === 0) {
        console.log('Invalid user information detected');
        res.status(400).json({ error: "Could not determine user information from authentication." });
        return;
    }

    try {
        console.log('Attempting to create repository:', repoName, 'for user:', username);
        // Use the factory function from git module to create repository
        await createRepository(repoName, username, userId);
        
        console.log('Repository created successfully');
        res.status(201).json({ 
            message: `Repository '${username}/${repoName}' created successfully.`,
            repository: {
                name: repoName,
                path: `${username}/${repoName}.git`,
                owner: username,
                owner_id: userId
            }
        });
        console.log('=== GIT CONTROLLER END ===');
    } catch (error) {
        console.log('=== GIT CONTROLLER ERROR ===');
        console.error('Error creating repository:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
        res.status(500).json({ 
            error: "Failed to create repository", 
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
