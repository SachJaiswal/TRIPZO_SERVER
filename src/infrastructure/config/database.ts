
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

// Load environment variables
dotenv.config();

const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  throw new Error("Please define MONGO_URI in your .env file");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // Prevent multiple MongoClient instances during development
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoClient: MongoClient | undefined;
}

if (!global._mongoClientPromise) {
  client = new MongoClient(mongoURI, {
    maxPoolSize: 10,
  });

  global._mongoClient = client;
  global._mongoClientPromise = client.connect();
} else {
  client = global._mongoClient!;
}

clientPromise = global._mongoClientPromise;

// Returns the connected MongoClient instance
export async function getClient(): Promise<MongoClient> {
  return clientPromise;
}

export { client };