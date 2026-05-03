import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import passport from "passport";
import { createServer } from "http";
import { Server } from "socket.io";
import { pool } from "./db";
import authRouter from "./routes/authRoutes";

const session = require("express-session");
const {
  Strategy: GoogleStrategy,
} = require("passport-google-oauth20");

dotenv.config();

const app = express();

app.use(
  session({
    secret: "codemesh_google_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use("/auth", authRouter);

const languageMap: Record<string, number> = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
};

const judge0Url =
  process.env.JUDGE0_URL ||
  "http://127.0.0.1:2358/submissions?base64_encoded=false&wait=true";
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const port = Number(process.env.PORT) || 5000;
const JWT_SECRET =
  process.env.JWT_SECRET || "codemesh_secret_key";

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user as any);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        "http://localhost:5000/auth/google/callback",
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

        let result = await pool.query(
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

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req: any, res) => {
    const user = req.user;

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    res.redirect("http://localhost:5173/");
  }
);

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

app.post("/run", async (req, res) => {
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


app.post("/save-room", async (req, res) => {
  try {
    const { roomId, code, language } = req.body;

    await pool.query(
      `
      INSERT INTO rooms (room_id, code, language)
      VALUES ($1, $2, $3)
      ON CONFLICT (room_id)
      DO UPDATE SET
        code = EXCLUDED.code,
        language = EXCLUDED.language,
        updated_at = CURRENT_TIMESTAMP
      `,
      [roomId, code, language]
    );

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
});



app.get("/room/:roomId", async (req, res) => {
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

const buildRoomPresence = (roomId: string, excludeSocketId?: string) => {
  const room = io.sockets.adapter.rooms.get(roomId);
  const socketIds = Array.from(room?.keys() ?? []).filter(
    (sid) => sid !== excludeSocketId
  );

  return {
    count: socketIds.length,
    userList: socketIds.map((sid) => ({
      id: sid,
      username:
        io.sockets.sockets.get(sid)?.data?.username || "Guest",
    })),
  };
};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const emitRoomPresence = (
    roomId: string,
    options?: { excludeSocketId?: string; broadcastOnly?: boolean }
  ) => {
    const { count, userList } = buildRoomPresence(
      roomId,
      options?.excludeSocketId
    );
    const target = options?.broadcastOnly ? socket.to(roomId) : io.to(roomId);

    target.emit("user-count", count);
    target.emit("user-list", userList);

    console.log(
      `[room:${roomId}] presence -> ${count} users`,
      userList.map((user) => `${user.username}:${user.id}`)
    );
  };

  const leaveRoom = (roomId: string, username?: string) => {
    if (!socket.rooms.has(roomId)) {
      return;
    }

    socket.leave(roomId);
    socket.to(roomId).emit(
      "room-notice",
      `${username || socket.data.username || "Someone"} left`
    );
    emitRoomPresence(roomId);

    console.log(
      `${username || socket.data.username || "Someone"} (${socket.id}) left ${roomId}`
    );
  };

  socket.on("join-room", ({ roomId, username }) => {
    socket.data.username = username;
    if (socket.rooms.has(roomId)) {
      console.log(
        `[join-room] duplicate ignored for ${username} (${socket.id}) in ${roomId}`
      );
      emitRoomPresence(roomId);
      return;
    }

    socket.join(roomId);
    console.log(
      `[join-room] requesting current state for ${socket.id} in ${roomId}`
    );
    socket.to(roomId).emit("request-current-state", socket.id);
    socket.to(roomId).emit("room-notice", `${username} joined`);

    emitRoomPresence(roomId);

    const { count } = buildRoomPresence(roomId);
    const room = io.sockets.adapter.rooms.get(roomId);

    // Broadcast full user list with names so sidebar shows real names
    const userList = Array.from(room?.keys() ?? []).map((sid) => ({
      id: sid,
      username: io.sockets.sockets.get(sid)?.data?.username || "Guest",
    }));
    io.to(roomId).emit("user-list", userList);

    console.log(`${username} (${socket.id}) joined ${roomId} — ${count} users`);
  });

  socket.on("leave-room", ({ roomId, username }) => {
    leaveRoom(roomId, username);
  });

  socket.on("code-change", ({ roomId, code }) => {
    console.log(
      `[code-change] room=${roomId} socket=${socket.id} length=${code?.length ?? 0}`
    );
    socket.to(roomId).emit("receive-code", code);
  });

  socket.on("language-change", ({ roomId, language }) => {
    console.log(
      `[language-change] room=${roomId} socket=${socket.id} language=${language}`
    );
    socket.to(roomId).emit("receive-language", language);
  });

  socket.on("cursor-change", ({ roomId, line, column }) => {
    socket.to(roomId).emit("receive-cursor", {
      userId: socket.id,
      line,
      column,
    });
  });

  socket.on("send-output", ({ roomId, output }) => {
    socket.to(roomId).emit("receive-output", output);
  });

  socket.on("send-current-state", ({ targetId, code, language }) => {
    console.log(
      `[send-current-state] from=${socket.id} to=${targetId} length=${code?.length ?? 0} language=${language}`
    );
    io.to(targetId).emit("receive-current-state", {
      code,
      language,
    });
  });

  socket.on("disconnecting", () => {
    const username = socket.data.username || "Someone";

    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        const room = io.sockets.adapter.rooms.get(roomId);
        const count = room ? room.size - 1 : 0;

        io.to(roomId).emit("user-count", count);
        socket.to(roomId).emit("room-notice", `${username} left`);

        // Send updated user list (excluding the leaving socket)
        const userList = Array.from(room?.keys() ?? [])
          .filter((sid) => sid !== socket.id)
          .map((sid) => ({
            id: sid,
            username: io.sockets.sockets.get(sid)?.data?.username || "Guest",
          }));
        socket.to(roomId).emit("user-list", userList);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
