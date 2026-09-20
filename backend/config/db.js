import mongoose from "mongoose";

export async function connectDB(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected (${mongoose.connection.name})`);
  } catch (err) {
    console.error(`Could not connect to MongoDB at ${uri}\n${err.message}`);
    console.error("Is mongod running? Or is MONGO_URI in .env pointing at your Atlas cluster?");
    process.exit(1);
  }
}
