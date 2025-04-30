import { Request, Response } from 'express';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

const execPromise = util.promisify(exec);
const readFilePromise = util.promisify(fs.readFile);
const writeFilePromise = util.promisify(fs.writeFile);
const readdirPromise = util.promisify(fs.readdir);
const statPromise = util.promisify(fs.stat);

export class FolderPreviewController {
  private readonly sourceGitPathRoot = '/srv/git/';
  private readonly tempWorkdirPathRoot = '/srv/git/tempworkdir/';

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
    return path.join(this.tempWorkdirPathRoot, username);
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
      const userTempWorkdirPath = this.getUserTempWorkdirPath(username);

      // Ensure the user's temp directory exists before proceeding
      if (!fs.existsSync(userTempWorkdirPath)) {
        res.status(404).json({ error: `User temporary directory not found for ${username}` });
        return;
      }

      const { relativePath, newContent } = req.body;

      if (!relativePath || newContent === undefined) {
        res.status(400).json({ error: 'Path and new content are required' });
        return;
      }

      // Ensure path is relative and safe
      const normalizedPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
      // Construct full path within the user's temp directory
      const fullPath = path.resolve(userTempWorkdirPath, normalizedPath);

      // Verification Step: Check if the resolved path is still within the user's allowed directory
      if (!fullPath.startsWith(path.resolve(userTempWorkdirPath) + path.sep) && fullPath !== path.resolve(userTempWorkdirPath)) {
        res.status(403).json({ error: 'Access denied: Path is outside the allowed directory.' });
        return;
      }

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const stats = await statPromise(fullPath);
      if (!stats.isFile()) {
        res.status(400).json({ error: 'The specified path is not a file' });
        return;
      }

      // Update file content
      await writeFilePromise(fullPath, newContent, 'utf8');

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
}
