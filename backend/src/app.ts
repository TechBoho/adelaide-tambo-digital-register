import express from "express";
import cors from "cors";
import pool from "./config/db";

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

app.get("/api/db-health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS server_time");

    res.status(200).json({
      success: true,
      message: "PostgreSQL connected successfully",
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});


app.get("/api/activities", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, category, name
       FROM activities
       WHERE is_active = TRUE
       ORDER BY id`
    );

    res.status(200).json({
      success: true,
      activities: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch activities:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve activities",
    });
  }
});


export default app;