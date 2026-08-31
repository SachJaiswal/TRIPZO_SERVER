export interface IStorageProvider {
  /**
   * Uploads a file buffer to the active storage container.
   * @param file Express Multer File containing the raw buffer.
   * @param folder Directory namespace or sub-bucket prefix.
   * @returns Public file access URL.
   */
  uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;

  /**
   * Removes a file from the active storage container by url.
   * @param fileUrl Public access URL of the resource.
   */
  deleteFile(fileUrl: string): Promise<void>;
}
