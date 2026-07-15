import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let _mongoServer;

/**
 * globalSetup runs once before all test files.
 * Starts a single shared MongoMemoryServer and sets MONGODB_URI in process.env.
 */
export async function setup() {
  _mongoServer = await MongoMemoryServer.create({
    instance: {
      startupTimeout: 60000,
    },
  });
  process.env.MONGODB_URI = _mongoServer.getUri();
}

/**
 * globalTeardown runs once after all test files.
 * Disconnects mongoose and stops the MongoMemoryServer.
 */
export async function teardown() {
  await mongoose.disconnect();
  if (_mongoServer) {
    await _mongoServer.stop();
  }
}
