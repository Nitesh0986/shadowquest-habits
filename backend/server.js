import mongoose from "mongoose";
import { env, assertEnv } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

assertEnv();
await connectDB(env.mongoUri);

const server = app.listen(env.port, () => {
  console.log(`ShadowQuest API running on http://localhost:${env.port}`);
});

async function shutdown() {
  server.close();
  await mongoose.connection.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
