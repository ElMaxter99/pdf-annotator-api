import { app } from "./app.js";
import { config } from "./config/env.js";
import { connectDatabase } from "./db/connection.js";

const start = async () => {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      console.log(`API running on http://localhost:${config.port}/api/v1`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
