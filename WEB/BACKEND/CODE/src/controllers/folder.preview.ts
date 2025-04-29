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
  private readonly sourceGitPath = '/srv/git/';
  private readonly tempWorkdirPath = '/srv/git/tempworkdir/';

  /**
   * Clone a Git repository from source location to tempworkdir
   * @param req Request containing repository name
   * @param res Response
   */
  public async cloneGitFolder(req: Request, res: Response): Promise<void> {
    try {
      const { repoName } = req.body;

      if (!repoName) {
        res.status(400).json({ error: 'Repository name is required' });
        return;
      }

      const sourcePath = path.join(this.sourceGitPath, repoName);
      const targetPath = path.join(this.tempWorkdirPath, repoName);

      // Check if source exists
      if (!fs.existsSync(sourcePath)) {
        res.status(404).json({ error: `Repository ${repoName} not found` });
        return;
      }

      // Create target directory if it doesn't exist
      if (!fs.existsSync(this.tempWorkdirPath)) {
        fs.mkdirSync(this.tempWorkdirPath, { recursive: true });
      }

      // Clone the repository using Git
      await execPromise(`git clone file://${sourcePath} ${targetPath}`);

      res.status(200).json({
        success: true,
        message: `Repository ${repoName} successfully cloned to ${targetPath}`,
        path: targetPath
      });
    } catch (error) {
      console.error('Error cloning repository:', error);
      res.status(500).json({ error: `Failed to clone repository: ${error.message}` });
    }
  }

  /**
   * Get content of a file or directory
   * @param req Request containing path
   * @param res Response
   */
  public async getPathContent(req: Request, res: Response): Promise<void> {
    try {
      const { relativePath } = req.query;
      
      if (!relativePath) {
        res.status(400).json({ error: 'Path parameter is required' });
        return;
      }

      // Ensure path is relative and safe (no path traversal)
      const normalizedPath = path.normalize(relativePath as string).replace(/^(\.\.(\/|\\|$))+/, '');
      const fullPath = path.join(this.tempWorkdirPath, normalizedPath);

      // Check if path exists
      if (!fs.existsSync(fullPath)) {
        res.status(404).json({ error: 'Path not found' });
        return;
      }

      const stats = await statPromise(fullPath);

      if (stats.isDirectory()) {
        // List directory contents like "ls" command
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
          path: normalizedPath,
          content: contentDetails
        });
      } else if (stats.isFile()) {
        // Return file content
        const fileContent = await readFilePromise(fullPath, 'utf8');
        res.status(200).json({
          type: 'file',
          path: normalizedPath,
          content: fileContent,
          size: stats.size,
          lastModified: stats.mtime
        });
      } else {
        res.status(400).json({ error: 'Path is neither a file nor a directory' });
      }
    } catch (error) {
      console.error('Error fetching path content:', error);
      res.status(500).json({ error: `Failed to fetch path content: ${error.message}` });
    }
  }

  /**
   * Modify file content
   * @param req Request containing path and new content
   * @param res Response
   */
  public async modifyFileContent(req: Request, res: Response): Promise<void> {
    try {
      const { relativePath, newContent } = req.body;
      
      if (!relativePath || newContent === undefined) {
        res.status(400).json({ error: 'Path and new content are required' });
        return;
      }

      // Ensure path is relative and safe
      const normalizedPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
      const fullPath = path.join(this.tempWorkdirPath, normalizedPath);

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
        path: normalizedPath
      });
    } catch (error) {
      console.error('Error updating file:', error);
      res.status(500).json({ error: `Failed to update file: ${error.message}` });
    }
  }
}
