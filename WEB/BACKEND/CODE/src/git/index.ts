import { Container } from 'inversify';
import 'reflect-metadata';
import { GitCrud } from './git.crud';
import { RepositoryRepository } from '../repositories/repository.repository';
import container from '../di/inversify.config';

// Export the GitCrud service instance from container
export const getGitCrud = (): GitCrud => {
    console.log('Getting GitCrud instance from container');
    try {
        const gitCrud = container.get<GitCrud>(GitCrud);
        console.log('GitCrud instance retrieved successfully');
        return gitCrud;
    } catch (error) {
        console.error('Error getting GitCrud instance:', error);
        throw error;
    }
};

// Factory function to create a Git repository
export const createRepository = async (repoName: string, username: string, userId: number): Promise<void> => {
    console.log('=== GIT INDEX: createRepository START ===');
    console.log('Parameters received - repoName:', repoName, 'username:', username, 'userId:', userId);
    
    try {
        const gitCrud = getGitCrud();
        const repoData = {
            name: repoName,
            repoName: repoName,
            username: username,
            owner_user_id: userId,
            description: `Repository created for ${username}`,
            is_private: false
        };
        
        console.log('Repository data prepared:', JSON.stringify(repoData));
        console.log('Calling GitCrud.createBareRepo method');
        
        await gitCrud.createBareRepo(userId, repoData);
        console.log('=== GIT INDEX: createRepository END - Success ===');
    } catch (error) {
        console.error('=== GIT INDEX: createRepository ERROR ===');
        console.error('Error in createRepository factory function:', error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
        throw error;
    }
};

// Factory function to delete a Git repository
export const deleteRepository = async (repoId: number): Promise<void> => {
    const gitCrud = getGitCrud();
    return gitCrud.deleteBareRepo(repoId);
};

// Export direct access to the createBareRepo function
export { createBareRepo } from './initGitRepo';