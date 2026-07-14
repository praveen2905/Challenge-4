import mongoose from "mongoose";

let _memServer = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } else {
    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      _memServer = await MongoMemoryServer.create();
      const memUri = _memServer.getUri();
      await mongoose.connect(memUri);
      console.log(
        "Connected to in-memory MongoDB (set MONGODB_URI for persistent storage)"
      );
    } catch (e) {
      console.error("Failed to start in-memory MongoDB", e);
      throw e;
    }
  }

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (_memServer) {
    await _memServer.stop();
  }
}
