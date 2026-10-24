import express from "express";
import cors from "cors";
import pool from "./config/db";
import type { PoolClient } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAdmin } from "./middleware/auth";
import { generatePdfReport } from "./utils/pdfReport";

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


app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    const result = await pool.query(
      `SELECT id, username, password_hash
       FROM admin_users
       WHERE username = $1`,
      [username.trim()]
    );

    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign(
      { role: "admin" },
      secret,
      {
        algorithm: "HS256",
        subject: admin.id,
        expiresIn: "8h",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("Admin login failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
});


app.get("/api/admin/me", requireAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Supervisor access verified"
  });
});


app.get("/api/admin/registrations", requireAdmin, async (req, res) => {
  const date = req.query.date;

  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid date is required (YYYY-MM-DD)"
    });
  }

  try {
    const result = await pool.query(
      `SELECT
         vr.id,
         vr.initials_surname AS "initialsSurname",
         vr.visitor_count AS "visitorCount",
         vr.registered_at AS "registeredAt",
         COALESCE(
           json_agg(
             json_build_object(
               'activityId', a.id,
               'activityName', a.name,
               'category', a.category,
               'visitorCount', ra.activity_visitor_count
             )
             ORDER BY a.id
           ) FILTER (WHERE a.id IS NOT NULL),
           '[]'::json
         ) AS activities
       FROM visitor_registrations vr
       LEFT JOIN registration_activities ra
         ON vr.id = ra.registration_id
       LEFT JOIN activities a
         ON ra.activity_id = a.id
       WHERE vr.registered_at >= ($1::date AT TIME ZONE 'Africa/Johannesburg')
         AND vr.registered_at < (($1::date + 1) AT TIME ZONE 'Africa/Johannesburg')
       GROUP BY vr.id
       ORDER BY vr.registered_at DESC`,
      [date]
    );

    return res.status(200).json({
      success: true,
      date,
      totalRegistrations: result.rows.length,
      totalVisitors: result.rows.reduce(
        (sum, row) => sum + row.visitorCount,
        0
      ),
      registrations: result.rows
    });
  } catch (error) {
    console.error("Failed to retrieve registrations:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve registrations"
    });
  }
});


app.get("/api/admin/statistics", requireAdmin, async (req, res) => {
  const { period, date, year, month } = req.query;

  let startDate: string;
  let endDate: string;

  try {
    if (period === "daily") {
      if (
        typeof date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
        new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid date required (YYYY-MM-DD)"
        });
      }

      startDate = date;
      const next = new Date(`${date}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      endDate = next.toISOString().slice(0, 10);

    } else if (period === "monthly") {
      const y = Number(year);
      const m = Number(month);

      if (
        typeof year !== "string" ||
        !/^\d{4}$/.test(year) ||
        y < 2000 ||
        y > 9999 ||
        typeof month !== "string" ||
        !/^(0?[1-9]|1[0-2])$/.test(month)
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid year and month required"
        });
      }

      startDate = `${year}-${String(m).padStart(2, "0")}-01`;
      const next = new Date(Date.UTC(y, m, 1));
      endDate = next.toISOString().slice(0, 10);

    } else if (period === "yearly") {
      if (
        typeof year !== "string" ||
        !/^\d{4}$/.test(year) ||
        Number(year) < 2000 ||
        Number(year) > 9998
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid year required"
        });
      }

      startDate = `${year}-01-01`;
      endDate = `${Number(year) + 1}-01-01`;

    } else {
      return res.status(400).json({
        success: false,
        message: "Period must be daily, monthly or yearly"
      });
    }

    const totals = await pool.query(
      `SELECT
         COUNT(*)::int AS "totalRegistrations",
         COALESCE(SUM(visitor_count), 0)::int AS "totalVisitors"
       FROM visitor_registrations
       WHERE registered_at >= ($1::date AT TIME ZONE 'Africa/Johannesburg')
         AND registered_at < ($2::date AT TIME ZONE 'Africa/Johannesburg')`,
      [startDate, endDate]
    );

    const activities = await pool.query(
      `SELECT
         a.id AS "activityId",
         a.category,
         a.name AS "activityName",
         COALESCE(SUM(ra.activity_visitor_count), 0)::int AS "visitorCount"
       FROM activities a
       LEFT JOIN registration_activities ra
         ON ra.activity_id = a.id
       LEFT JOIN visitor_registrations vr
         ON vr.id = ra.registration_id
       WHERE vr.registered_at >= ($1::date AT TIME ZONE 'Africa/Johannesburg')
         AND vr.registered_at < ($2::date AT TIME ZONE 'Africa/Johannesburg')
       GROUP BY a.id, a.category, a.name
       ORDER BY a.id`,
      [startDate, endDate]
    );

    return res.status(200).json({
      success: true,
      period,
      startDate,
      endDateExclusive: endDate,
      ...totals.rows[0],
      activities: activities.rows
    });

  } catch (error) {
    console.error("Statistics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve statistics"
    });
  }
});


app.get("/api/admin/reports/monthly", requireAdmin, async (req, res) => {
  const { year, month } = req.query;

  const y = Number(year);
  const m = Number(month);

  if (
    typeof year !== "string" ||
    !/^\d{4}$/.test(year) ||
    y < 2000 ||
    y > 9999 ||
    typeof month !== "string" ||
    !/^(0?[1-9]|1[0-2])$/.test(month)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid year and month required"
    });
  }

  try {
    await generatePdfReport(res, "monthly", y, m);
  } catch (error) {
    console.error("Monthly PDF report failed:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Unable to generate monthly report"
      });
    } else {
      res.destroy();
    }
  }
});

app.get("/api/admin/reports/yearly", requireAdmin, async (req, res) => {
  const { year } = req.query;

  const y = Number(year);

  if (
    typeof year !== "string" ||
    !/^\d{4}$/.test(year) ||
    y < 2000 ||
    y > 9998
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid year required"
    });
  }

  try {
    await generatePdfReport(res, "yearly", y);
  } catch (error) {
    console.error("Yearly PDF report failed:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Unable to generate yearly report"
      });
    } else {
      res.destroy();
    }
  }
});


export default app;