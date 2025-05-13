import { Request, Response } from 'express';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as fsp from 'fs/promises'; // Import promises API
import * as path from 'path';
import * as util from 'util';
import { injectable } from 'inversify';

const execPromise = util.promisify(exec);
const readFilePromise = util.promisify(fs.readFile);
const writeFilePromise = util.promisify(fs.writeFile);
const readdirPromise = util.promisify(fs.readdir);
const statPromise = util.promisify(fs.stat);

@injectable()
export class FolderPreviewController {
  private readonly sourceGitPathRoot = '/srv/git/';

  /**
   * Get user-specific source git path
   * @param username The username from the authenticated request
   */
  private getUserSourceGitPath(username: string): string {
    return path.join(this.sourceGitPathRoot, username);
  }

  /**
   * Get user-specific temporary workdir path
   * @param username The username from the authenticated request
   */
  private getUserTempWorkdirPath(username: string): string {
    // Construct the temp path inside the user's source git path
    const userSourcePath = this.getUserSourceGitPath(username);
    return path.join(userSourcePath, 'temp-working-directory');
  }

  /**
   * Helper to resolve and validate path within user's temp workdir
   */
  private resolveAndValidatePath(username: string, relativePath: string): { fullPath: string, normalizedPath: string, userTempWorkdirPath: string } | { error: string, status: number } {
    const userTempWorkdirPath = this.getUserTempWorkdirPath(username);

    // Ensure the user's temp directory exists before proceeding
    if (!fs.existsSync(userTempWorkdirPath)) {
      return { error: `User temporary directory not found for ${username}`, status: 404 };
    }

    if (!relativePath || typeof relativePath !== 'string') {
      return { error: 'Path parameter is required and must be a string', status: 400 };
    }

    // Ensure path is relative and safe (no path traversal)
    const normalizedPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    // Construct full path within the user's temp directory
    const fullPath = path.resolve(userTempWorkdirPath, normalizedPath);

    // Verification Step: Check if the resolved path is still within the user's allowed directory
    const resolvedUserTempWorkdirPath = path.resolve(userTempWorkdirPath);
    if (!fullPath.startsWith(resolvedUserTempWorkdirPath + path.sep) && fullPath !== resolvedUserTempWorkdirPath) {
      return { error: 'Access denied: Path is outside the allowed directory.', status: 403 };
    }

    return { fullPath, normalizedPath, userTempWorkdirPath };
  }

  /**
   * Clone a Git repository from source location to tempworkdir
   * @param req Request containing repository name in URL parameters and user info
   * @param res Response
   */
  public async cloneGitFolder(req: Request, res: Response): Promise<void> {
    try {
      // Check for authenticated user
      if (!req.user || !req.user.username) {
        res.status(401).json({ error: 'Authentication required or username missing in token' });
        return;
      }
      const username = req.user.username;
      const userSourceGitPath = this.getUserSourceGitPath(username);
      const userTempWorkdirPath = this.getUserTempWorkdirPath(username);

      const { repoName } = req.params;

      if (!repoName) {
        res.status(400).json({ error: 'Repository name is required in the URL path' });
        return;
      }

      const sourcePath = path.join(userSourceGitPath, repoName);
      const targetPath = path.join(userTempWorkdirPath, repoName);

      // Check if source exists
      if (!fs.existsSync(sourcePath)) {
        res.status(404).json({ error: `Repository ${repoName} not found for user ${username}` });
        return;
      }

      // Create user-specific target directory if it doesn't exist
      if (!fs.existsSync(userTempWorkdirPath)) {
        fs.mkdirSync(userTempWorkdirPath, { recursive: true });
      }

      // Remove existing target directory if it exists, before cloning
      if (fs.existsSync(targetPath)) {
        await execPromise(`rm -rf ${targetPath}`);
      }

      // Clone the repository using Git
      await execPromise(`git clone file://${sourcePath} ${targetPath}`);

      res.status(200).json({
        success: true,
        message: `Repository ${repoName} successfully cloned to ${targetPath}`,
        path: targetPath // Consider returning a relative path if needed by the frontend
      });
    } catch (error) {
      console.error('Error cloning repository:', error);
      let errorMessage = 'Failed to clone repository';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      res.status(500).json({ error: errorMessage });
    }
  }

  /**
   * Get content of a file or directory within the user's temp workdir
   * @param req Request containing path and user info
   * @param res Response
   */
  public async getPathContent(req: Request, res: Response): Promise<void> {
    try {
      // Check for authenticated user
      if (!req.user || !req.user.username) {
        res.status(401).json({ error: 'Authentication required or username missing in token' });
        return;
      }
      const username = req.user.username;
      const userTempWorkdirPath = this.getUserTempWorkdirPath(username);

      // Ensure the user's temp directory exists before proceeding
      if (!fs.existsSync(userTempWorkdirPath)) {
        res.status(404).json({ error: `User temporary directory not found for ${username}` });
        return;
      }

      const { relativePath } = req.query;

      if (!relativePath) {
        res.status(400).json({ error: 'Path parameter is required' });
        return;
      }

      // Ensure path is relative and safe (no path traversal)
      const normalizedPath = path.normalize(relativePath as string).replace(/^(\.\.(\/|\\|$))+/, '');
      // Construct full path within the user's temp directory
      const fullPath = path.resolve(userTempWorkdirPath, normalizedPath);

      // Verification Step: Check if the resolved path is still within the user's allowed directory
      if (!fullPath.startsWith(path.resolve(userTempWorkdirPath) + path.sep) && fullPath !== path.resolve(userTempWorkdirPath)) {
        res.status(403).json({ error: 'Access denied: Path is outside the allowed directory.' });
        return;
      }

      // Check if path exists
      if (!fs.existsSync(fullPath)) {
        res.status(404).json({ error: 'Path not found' });
        return;
      }

      const stats = await statPromise(fullPath);

      if (stats.isDirectory()) {
        const items = await readdirPromise(fullPath);
        const contentDetails = await Promise.all(
          items.map(async (item) => {
            const itemPath = path.join(fullPath, item);
            const itemStat = await statPromise(itemPath);
            return {
              name: item,
              type: itemStat.isDirectory() ? 'folder' : 'file',
              size: itemStat.size,
              lastModified: itemStat.mtime
            };
          })
        );

        res.status(200).json({
          type: 'folder',
          path: normalizedPath, // Return the relative path
          content: contentDetails
        });
      } else if (stats.isFile()) {
        const fileContent = await readFilePromise(fullPath, 'utf8');
        res.status(200).json({
          type: 'file',
          path: normalizedPath, // Return the relative path
          content: fileContent,
          size: stats.size,
          lastModified: stats.mtime
        });
      } else {
        res.status(400).json({ error: 'Path is neither a file nor a directory' });
      }
    } catch (error) {
      console.error('Error fetching path content:', error);
      let errorMessage = 'Failed to fetch path content';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      res.status(500).json({ error: errorMessage });
    }
  }

  /**
   * Modify file content within the user's temp workdir
   * @param req Request containing path, new content, and user info
   * @param res Response
   */
  public async modifyFileContent(req: Request, res: Response): Promise<void> {
    try {
      // Check for authenticated user
      if (!req.user || !req.user.username) {
        res.status(401).json({ error: 'Authentication required or username missing in token' });
        return;
      }
      const username = req.user.username;

      const { relativePath, newContent } = req.body;

      if (newContent === undefined) { // Allow empty string content, but not undefined
        res.status(400).json({ error: 'New content is required' });
        return;
      }

      // Resolve and validate path
      const pathValidationResult = this.resolveAndValidatePath(username, relativePath);
      if ('error' in pathValidationResult) {
        res.status(pathValidationResult.status).json({ error: pathValidationResult.error });
        return;
      }
      const { fullPath, normalizedPath } = pathValidationResult;

      // Check if file exists using stat to avoid race conditions slightly better than existsSync
      let stats;
      try {
        stats = await statPromise(fullPath);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          res.status(404).json({ error: 'File not found' });
          return;
        }
        throw err; // Re-throw other errors
      }

      if (!stats.isFile()) {
        res.status(400).json({ error: 'The specified path is not a file' });
        return;
      }

      // Update file content using fs.promises.writeFile
      await fsp.writeFile(fullPath, newContent, 'utf8');

      res.status(200).json({
        success: true,
        message: 'File updated successfully',
        path: normalizedPath // Return the relative path
      });
    } catch (error) {
      console.error('Error updating file:', error);
      let errorMessage = 'Failed to update file';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      res.status(500).json({ error: errorMessage });
    }
  }

  /**
   * Create a file or folder within the user's temp workdir
   * @param req Request containing relativePath, type ('file' or 'folder'), and user info
   * @param res Response
   */
  public async createItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.username) {
        res.status(401).json({ error: 'Authentication required or username missing in token' });
        return;
      }
      const username = req.user.username;
      const { relativePath, type, content } = req.body; // content is optional, for files

      if (!type || (type !== 'file' && type !== 'folder')) {
        res.status(400).json({ error: 'Type parameter (\'file\' or \'folder\') is required' });
        return;
      }

      const pathValidationResult = this.resolveAndValidatePath(username, relativePath);
      if ('error' in pathValidationResult) {
        res.status(pathValidationResult.status).json({ error: pathValidationResult.error });
        return;
      }
      const { fullPath, normalizedPath } = pathValidationResult;

      // Check if item already exists
      try {
        await statPromise(fullPath);
        // If statPromise succeeds, the item exists
        res.status(409).json({ error: `Item already exists at path: ${normalizedPath}` });
        return;
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err; // Re-throw unexpected errors
        }
        // ENOENT means the path does not exist, which is good, continue creation
      }

      // Ensure parent directory exists
      const parentDir = path.dirname(fullPath);
      await fsp.mkdir(parentDir, { recursive: true });

      if (type === 'folder') {
        await fsp.mkdir(fullPath);
        res.status(201).json({
          success: true,
          message: `Folder created successfully at ${normalizedPath}`,
          path: normalizedPath,
          type: 'folder'
        });
      } else { // type === 'file'
        await fsp.writeFile(fullPath, content || '', 'utf8'); // Create file with optional content or empty
        res.status(201).json({
          success: true,
          message: `File created successfully at ${normalizedPath}`,
          path: normalizedPath,
          type: 'file'
        });
      }
    } catch (error) {
      console.error('Error creating item:', error);
      let errorMessage = 'Failed to create item';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      res.status(500).json({ error: errorMessage });
    }
  }

  /**
   * Remove a file or folder within the user's temp workdir
   * @param req Request containing relativePath (query param) and user info
   * @param res Response
   */
  public async removeItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.username) {
        res.status(401).json({ error: 'Authentication required or username missing in token' });
        return;
      }
      const username = req.user.username;
      const { relativePath } = req.query;

      const pathValidationResult = this.resolveAndValidatePath(username, relativePath as string);
      if ('error' in pathValidationResult) {
        res.status(pathValidationResult.status).json({ error: pathValidationResult.error });
        return;
      }
      const { fullPath, normalizedPath } = pathValidationResult;

      // Check if item exists before attempting removal
      try {
        await statPromise(fullPath);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          res.status(404).json({ error: 'Item not found' });
          return;
        }
        throw err; // Re-throw other errors
      }

      // Remove file or directory (recursively)
      await fsp.rm(fullPath, { recursive: true, force: true }); // force handles non-empty dirs

      res.status(200).json({
        success: true,
        message: `Item removed successfully from ${normalizedPath}`,
        path: normalizedPath
      });
    } catch (error) {
      console.error('Error removing item:', error);
      let errorMessage = 'Failed to remove item';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      res.status(500).json({ error: errorMessage });
    }
  }

  /**
   * Rename/move a file or folder within the user's temp workdir
   * @param req Request containing oldRelativePath, newRelativePath, and user info
   * @param res Response
   */
  public async renameItem(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.username) {
        res.status(401).json({ error: 'Authentication required or username missing in token' });
        return;
      }
      const username = req.user.username;
      const { oldRelativePath, newRelativePath } = req.body;

      if (!newRelativePath) {
        res.status(400).json({ error: 'New path parameter is required' });
        return;
      }

      // Validate old path
      const oldPathValidation = this.resolveAndValidatePath(username, oldRelativePath);
      if ('error' in oldPathValidation) {
        res.status(oldPathValidation.status).json({ error: `Old path error: ${oldPathValidation.error}` });
        return;
      }
      const { fullPath: oldFullPath, normalizedPath: normalizedOldPath } = oldPathValidation;

      // Validate new path
      const newPathValidation = this.resolveAndValidatePath(username, newRelativePath);
      if ('error' in newPathValidation) {
        res.status(newPathValidation.status).json({ error: `New path error: ${newPathValidation.error}` });
        return;
      }
      const { fullPath: newFullPath, normalizedPath: normalizedNewPath } = newPathValidation;

      // Check if old item exists
      try {
        await statPromise(oldFullPath);
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          res.status(404).json({ error: `Source item not found at ${normalizedOldPath}` });
          return;
        }
        throw err; // Re-throw other errors
      }

      // Check if new path already exists
      try {
        await statPromise(newFullPath);
        // If stat succeeds, the target path exists
        res.status(409).json({ error: `Target path already exists at ${normalizedNewPath}` });
        return;
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          throw err; // Re-throw unexpected errors
        }
        // ENOENT means the target path does not exist, which is good
      }

      // Ensure parent directory of the new path exists
      const newParentDir = path.dirname(newFullPath);
      await fsp.mkdir(newParentDir, { recursive: true });

      // Rename/move the item
      await fsp.rename(oldFullPath, newFullPath);

      res.status(200).json({
        success: true,
        message: `Item successfully renamed/moved from ${normalizedOldPath} to ${normalizedNewPath}`,
        oldPath: normalizedOldPath,
        newPath: normalizedNewPath
      });
    } catch (error) {
      console.error('Error renaming item:', error);
      let errorMessage = 'Failed to rename item';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      res.status(500).json({ error: errorMessage });
    }
  }
}
