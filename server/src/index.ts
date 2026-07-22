// Must be first: ./config loads dotenv, and ./db reads process.env at import time.
import {
  JWT_SECRET,
  SESSION_SECRET,
  clientUrl,
  port,
  judge0Url,
  googleAuth,
} from "./config.js";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createServer } from "http";
import { Server } from "socket.io";
import { pool } from "./db.js";
import { attachCollabServer } from "./collab.js";

const app = express();

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// Judge0 language ids — keep in sync with LANGUAGES in client/src/pages/EditorRoom.tsx
const languageMap: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user as any);
});

if (!googleAuth) {
  console.warn(
    "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google sign-in is disabled."
  );
}

if (googleAuth) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleAuth.clientId,
        clientSecret: googleAuth.clientSecret,
        callbackURL: googleAuth.callbackUrl,
      },
      async (
        _accessToken: any,
        _refreshToken: any,
        profile: any,
        done: any
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          const username = profile.displayName;

          const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
          );

          let user;

          if (result.rows.length === 0) {
            const newUser = await pool.query(
              `
              INSERT INTO users (username, email, password)
              VALUES ($1, $2, $3)
              RETURNING *
              `,
              [username, email, "google_oauth"]
            );

            user = newUser.rows[0];
          } else {
            user = result.rows[0];
          }

          done(null, user);
        } catch (error) {
          done(error as any, null);
        }
      }
    )
  );
}

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    (req as any).user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email
      `,
      [username, email, hashedPassword]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    res.json({
      message: "Signup successful",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

if (googleAuth) {
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${clientUrl}/login`,
      session: false,
    }),
    (req: any, res) => {
      const user = req.user;

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
      });

      res.redirect(`${clientUrl}/`);
    }
  );
} else {
  app.get("/auth/google", (_req, res) => {
    res.status(503).json({
      message: "Google sign-in is not configured on this server.",
    });
  });
}

app.get("/me", authMiddleware, async (req, res) => {
  try {
    const userData = (req as any).user;

    const result = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [userData.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
});


app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
  });

  res.json({
    message: "Logged out successfully",
  });
});

app.post("/run", authMiddleware, async (req, res) => {
  try {
    const { code, language, input } = req.body;
    const languageId = languageMap[language];

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        output: "Code is required.",
      });
    }

    if (!languageId) {
      return res.status(400).json({
        output: "Unsupported language selected.",
      });
    }

    const submit = await axios.post(
      judge0Url,
      {
        source_code: code,
        language_id: languageId,
        stdin: input,
      },
      {
        timeout: 30000,
      }
    );

    const data = submit.data;

    res.json({
      output:
        data.stdout ||
        data.stderr ||
        data.compile_output ||
        "No output",
    });
  } catch (error: unknown) {
    const errorMessage = axios.isAxiosError(error)
      ? JSON.stringify(error.response?.data) || error.message
      : error instanceof Error
        ? error.message
        : "Execution failed";

    console.log("REAL ERROR:");
    console.log(errorMessage);

    res.status(500).json({
      output: errorMessage,
    });
  }
});


// NOTE: there is deliberately no /save-room endpoint. Rooms are persisted by
// the collaboration server (see collab.ts), which owns the live document. A
// second write path would let a client clobber the document behind Yjs's back.

app.get("/room/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;

    const result = await pool.query(
      "SELECT * FROM rooms WHERE room_id = $1",
      [roomId]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    console.log(error);
    res.status(500).json(null);
  }
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO now only carries run output and save notifications. The document,
// language, cursors and presence all travel over the Yjs connection in
// collab.ts, so the old code-change / cursor / state-handoff events are gone.
io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId }: { roomId: string }) => {
    socket.join(roomId);
  });

  socket.on("leave-room", ({ roomId }: { roomId: string }) => {
    socket.leave(roomId);
  });

  socket.on(
    "send-output",
    ({ roomId, output }: { roomId: string; output: string }) => {
      socket.to(roomId).emit("receive-output", output);
    }
  );
});

attachCollabServer(httpServer, (roomId) => {
  io.to(roomId).emit("room-saved");
});

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
