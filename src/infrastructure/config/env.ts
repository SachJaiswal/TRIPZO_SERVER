import dotenv from 'dotenv';

// Parse environment configuration
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || '',
  storageProvider: process.env.STORAGE_PROVIDER || 'local',
  localUploadDir: process.env.LOCAL_UPLOAD_DIR || 'uploads',

  // AWS S3 settings
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsBucketName: process.env.AWS_BUCKET_NAME || '',

  // Azure Blob Storage settings
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
  azureStorageContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME || '',

  // Google Cloud Storage settings
  gcpProjectId: process.env.GCP_PROJECT_ID || '',
  gcpKeyFilePath: process.env.GCP_KEY_FILE_PATH || '',
  gcpBucketName: process.env.GCP_BUCKET_NAME || '',

  // Email & Notification service settings
  emailProvider: process.env.EMAIL_PROVIDER || 'local',
  notificationProvider: process.env.NOTIFICATION_PROVIDER || 'local',
  azureCommunicationConnectionString: process.env.AZURE_COMMUNICATION_CONNECTION_STRING || '',
  azureCommunicationSenderAddress: process.env.AZURE_COMMUNICATION_SENDER_ADDRESS || 'donotreply@example.com',
};

// Check for missing configurations to log warnings during startup
if (env.storageProvider === 'aws') {
  if (!env.awsAccessKeyId || !env.awsSecretAccessKey || !env.awsBucketName) {
    console.warn('[env validation]: S3 configuration is incomplete in environment variables.');
  }
} else if (env.storageProvider === 'azure') {
  if (!env.azureStorageConnectionString || !env.azureStorageContainerName) {
    console.warn('[env validation]: Azure Blob Storage configuration is incomplete in environment variables.');
  }
} else if (env.storageProvider === 'gcp') {
  if (!env.gcpBucketName) {
    console.warn('[env validation]: GCP Storage configuration is incomplete in environment variables.');
  }
}

if (env.emailProvider === 'azure' && !env.azureCommunicationConnectionString) {
  console.warn('[env validation]: Azure Communication connection string is missing in environment variables.');
}

