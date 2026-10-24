import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  const token = authorization.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({
      success: false,
      message: "Authentication is not configured",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      decoded.role !== "admin" ||
      !decoded.sub
    ) {
      res.status(403).json({
        success: false,
        message: "Access denied",
      });
      return;
    }

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}