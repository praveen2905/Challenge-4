import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { seedDatabase } from "./utils/seed.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

async function main() {
  try {
    await connectDB();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 VenueIQ API running on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

main();
