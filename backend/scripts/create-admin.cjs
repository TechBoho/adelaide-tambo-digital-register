require("dotenv/config");

const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");

async function main() {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing");
    }

    const username = (await rl.question("Supervisor username: ")).trim();
    const password = await rl.question("Supervisor password: ");

    if (!username || username.length > 100 || password.length < 12) {
      throw new Error(
        "Username must be 1–100 characters and password at least 12 characters"
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      `INSERT INTO admin_users (username, password_hash)
       VALUES ($1, $2)`,
      [username, passwordHash]
    );

    console.log("Supervisor account created successfully.");
  } finally {
    rl.close();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Could not create supervisor account:", error.message);
  process.exitCode = 1;
});
