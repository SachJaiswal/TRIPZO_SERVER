import fs from 'fs';
import path from 'path';
import { IStorageProvider } from '../interfaces/IStorageProvider';
import { env } from '../../config/env';

export class LocalStorageProvider implements IStorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = env.localUploadDir;
  }

  async uploadFile(file: Express.Multer.File, folder: string = ''): Promise<string> {
    const targetDir = path.join(process.cwd(), this.uploadDir, folder);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const safeFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = path.join(targetDir, safeFilename);

    await fs.promises.writeFile(filePath, file.buffer);

    const relativePath = path.posix.join(this.uploadDir, folder, safeFilename);
    return `/${relativePath}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const cleanPath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    const filePath = path.join(process.cwd(), cleanPath);

    const resolvedPath = path.resolve(filePath);
    const rootUploads = path.resolve(path.join(process.cwd(), this.uploadDir));

    if (!resolvedPath.startsWith(rootUploads)) {
      throw new Error('Access denied: Invalid file path');
    }

    if (fs.existsSync(resolvedPath)) {
      await fs.promises.unlink(resolvedPath);
    }
  }
}
