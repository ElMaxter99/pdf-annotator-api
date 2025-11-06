import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// Versionado
app.use("/api/v1", routes);

// Middleware final de errores
app.use(errorHandler);
