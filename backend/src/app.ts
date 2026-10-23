import express from "express";
import cors from "cors";
import pool from "./config/db";
import type { PoolClient } from "pg";

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


app.post("/api/registrations", async (req, res) => {
  const { initialsSurname, visitorCount, activities } = req.body ?? {};

  if (
    typeof initialsSurname !== "string" ||
    !initialsSurname.trim() ||
    initialsSurname.trim().length > 150 ||
    !Number.isSafeInteger(visitorCount) ||
    visitorCount < 1 ||
    !Array.isArray(activities) ||
    activities.length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid visitor registration details",
    });
  }

  const activityIds = new Set<number>();

  for (const activity of activities) {
    if (
      !activity ||
      !Number.isSafeInteger(activity.activityId) ||
      activity.activityId < 1 ||
      !Number.isSafeInteger(activity.visitorCount) ||
      activity.visitorCount < 1 ||
      activity.visitorCount > visitorCount ||
      activityIds.has(activity.activityId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or duplicate activity selection",
      });
    }

    activityIds.add(activity.activityId);
  }

  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const validActivities = await client.query(
      `SELECT id FROM activities
       WHERE id = ANY($1::int[]) AND is_active = TRUE`,
      [Array.from(activityIds)]
    );

    if (validActivities.rowCount !== activityIds.size) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "One or more selected activities are unavailable",
      });
    }

    const registration = await client.query(
      `INSERT INTO visitor_registrations
       (initials_surname, visitor_count)
       VALUES ($1, $2)
       RETURNING id, initials_surname, visitor_count, registered_at`,
      [initialsSurname.trim(), visitorCount]
    );

    const saved = registration.rows[0];

    for (const activity of activities) {
      await client.query(
        `INSERT INTO registration_activities
         (registration_id, activity_id, activity_visitor_count)
         VALUES ($1, $2, $3)`,
        [saved.id, activity.activityId, activity.visitorCount]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Visitor registration completed successfully",
      registration: {
        id: saved.id,
        initialsSurname: saved.initials_surname,
        visitorCount: saved.visitor_count,
        registeredAt: saved.registered_at,
      },
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    console.error("Registration failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete registration",
    });
  } finally {
    client?.release();
  }
});


export default app;