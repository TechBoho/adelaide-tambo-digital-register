import express from "express";
import cors from "cors";

const app = express();

// Allow frontend requests during development.
// Restrict origins before deployment.
app.use(cors());

app.use(express.json());

// Health-check endpoint
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Adelaide Tambo Digital Register API is running"
  });
});

export default app;