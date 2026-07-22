import type { IncomingMessage, Server as HttpServer } from "http";
import type { Duplex } from "stream";
import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import { pool } from "./db.js";
import { COLLAB_PATH, JWT_SECRET } from "./config.js";

/**
 * Server half of the y-websocket protocol.
 *
 * y-websocket v3 no longer ships a server, and @y/websocket-server pulls a
 * prerelease Yjs that conflicts with the client's, so the protocol is
 * implemented here directly against the same yjs/y-protocols versions the
 * client uses. It is a small, stable surface: two message types.
 */
const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

// Shared type keys — these MUST match the client (see EditorRoom.tsx).
export const TEXT_KEY = "monaco";
export const META_KEY = "meta";

const DEFAULT_CODE = "// code here";
const DEFAULT_LANGUAGE = "javascript";
const SAVE_DEBOUNCE_MS = 2000;
const PING_INTERVAL_MS = 30000;

interface Room {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  connections: Map<WebSocket, Set<number>>;
  saveTimer: NodeJS.Timeout | null;
}

const rooms = new Map<string, Promise<Room>>();

const readLanguage = (doc: Y.Doc): string => {
  const language = doc.getMap(META_KEY).get("language");
  return typeof language === "string" ? language : DEFAULT_LANGUAGE;
};

const persistRoom = async (roomId: string, doc: Y.Doc) => {
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
    [roomId, doc.getText(TEXT_KEY).toString(), readLanguage(doc)]
  );
};

const send = (conn: WebSocket, message: Uint8Array) => {
  if (conn.readyState !== WebSocket.OPEN) {
    return;
  }

  try {
    conn.send(message);
  } catch {
    conn.close();
  }
};

/**
 * Loads a room's document from Postgres. Loading happens here, once, before
 * any client syncs — that is what stops each joining client from seeding its
 * own duplicate copy of the stored code.
 */
const createRoom = async (
  roomId: string,
  onRoomSaved?: (roomId: string) => void
): Promise<Room> => {
  const doc = new Y.Doc();

  const result = await pool.query(
    "SELECT code, language FROM rooms WHERE room_id = $1",
    [roomId]
  );
  const stored = result.rows[0];

  doc.getText(TEXT_KEY).insert(0, stored?.code ?? DEFAULT_CODE);
  doc.getMap(META_KEY).set("language", stored?.language ?? DEFAULT_LANGUAGE);

  const awareness = new awarenessProtocol.Awareness(doc);
  awareness.setLocalState(null);

  const room: Room = {
    doc,
    awareness,
    connections: new Map(),
    saveTimer: null,
  };

  const broadcast = (message: Uint8Array) => {
    room.connections.forEach((_clients, conn) => send(conn, message));
  };

  doc.on("update", (update: Uint8Array) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    broadcast(encoding.toUint8Array(encoder));

    if (room.saveTimer) {
      clearTimeout(room.saveTimer);
    }

    room.saveTimer = setTimeout(() => {
      persistRoom(roomId, doc)
        .then(() => onRoomSaved?.(roomId))
        .catch((error) =>
          console.error(`[collab] save failed for ${roomId}:`, error)
        );
    }, SAVE_DEBOUNCE_MS);
  });

  awareness.on(
    "update",
    (
      {
        added,
        updated,
        removed,
      }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      const changedClients = added.concat(updated, removed);

      // Track which awareness clients belong to which socket, so they can be
      // cleaned up if that socket drops.
      const trackedClients = room.connections.get(origin as WebSocket);
      if (trackedClients) {
        added.forEach((client) => trackedClients.add(client));
        removed.forEach((client) => trackedClients.delete(client));
      }

      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
      );
      broadcast(encoding.toUint8Array(encoder));
    }
  );

  console.log(`[collab] room ${roomId} loaded`);
  return room;
};

const getRoom = (roomId: string, onRoomSaved?: (roomId: string) => void) => {
  // Store the promise, not the room, so two simultaneous joins can't each
  // create and load a separate document for the same room.
  let pending = rooms.get(roomId);

  if (!pending) {
    pending = createRoom(roomId, onRoomSaved);
    rooms.set(roomId, pending);
  }

  return pending;
};

const closeRoomIfEmpty = async (roomId: string, room: Room) => {
  if (room.connections.size > 0) {
    return;
  }

  if (room.saveTimer) {
    clearTimeout(room.saveTimer);
    room.saveTimer = null;
  }

  rooms.delete(roomId);

  try {
    await persistRoom(roomId, room.doc);
    console.log(`[collab] room ${roomId} closed and saved`);
  } catch (error) {
    console.error(`[collab] final save failed for ${roomId}:`, error);
  } finally {
    room.doc.destroy();
  }
};

const setupConnection = (
  conn: WebSocket,
  roomId: string,
  room: Room,
  onRoomSaved?: (roomId: string) => void
) => {
  room.connections.set(conn, new Set());

  conn.binaryType = "arraybuffer";

  conn.on("message", (data: ArrayBuffer) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(data));
      const encoder = encoding.createEncoder();
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn);

          // An encoder holding only the message type means there is no reply.
          if (encoding.length(encoder) > 1) {
            send(conn, encoding.toUint8Array(encoder));
          }
          break;
        }

        case MESSAGE_AWARENESS: {
          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            decoding.readVarUint8Array(decoder),
            conn
          );
          break;
        }
      }
    } catch (error) {
      console.error(`[collab] message error in ${roomId}:`, error);
    }
  });

  let alive = true;
  conn.on("pong", () => {
    alive = true;
  });

  const pingTimer = setInterval(() => {
    if (!alive) {
      conn.terminate();
      return;
    }
    alive = false;
    try {
      conn.ping();
    } catch {
      conn.terminate();
    }
  }, PING_INTERVAL_MS);

  const handleClose = () => {
    clearInterval(pingTimer);

    const trackedClients = room.connections.get(conn);
    room.connections.delete(conn);

    if (trackedClients) {
      awarenessProtocol.removeAwarenessStates(
        room.awareness,
        Array.from(trackedClients),
        null
      );
    }

    void closeRoomIfEmpty(roomId, room);
  };

  conn.on("close", handleClose);
  conn.on("error", handleClose);

  // Step 1 of the sync handshake: tell the client what we have.
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(syncEncoder, room.doc);
  send(conn, encoding.toUint8Array(syncEncoder));

  // Then hand over everyone's current awareness state.
  const awarenessStates = room.awareness.getStates();

  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        room.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    send(conn, encoding.toUint8Array(awarenessEncoder));
  }

  void onRoomSaved;
};

const tokenFromCookies = (cookieHeader?: string): string | null => {
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === "token") {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
};

const roomIdFromUrl = (url: string | undefined): string | null => {
  const pathname = new URL(url ?? "/", "http://localhost").pathname;
  const roomId = pathname.slice(COLLAB_PATH.length).replace(/^\//, "");
  return roomId.length > 0 ? decodeURIComponent(roomId) : null;
};

/**
 * Attaches the collaboration websocket to the existing HTTP server. The live
 * document is the source of truth while a room is open; Postgres is written on
 * a debounce and again when the last client leaves.
 */
export const attachCollabServer = (
  httpServer: HttpServer,
  onRoomSaved?: (roomId: string) => void
) => {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on(
    "upgrade",
    (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

      // Not ours — leave it for socket.io's own upgrade handler.
      if (!pathname.startsWith(COLLAB_PATH)) {
        return;
      }

      const roomId = roomIdFromUrl(req.url);

      if (!roomId) {
        socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
        socket.destroy();
        return;
      }

      // The document is as sensitive as the REST endpoints, so it gets the
      // same cookie check rather than being an open back door into a room.
      const token = tokenFromCookies(req.headers.cookie);

      try {
        if (!token) {
          throw new Error("missing token");
        }
        jwt.verify(token, JWT_SECRET);
      } catch {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, async (conn) => {
        try {
          const room = await getRoom(roomId, onRoomSaved);
          setupConnection(conn, roomId, room, onRoomSaved);
          console.log(
            `[collab] client joined ${roomId} (${room.connections.size} connected)`
          );
        } catch (error) {
          console.error(`[collab] failed to open ${roomId}:`, error);
          conn.close();
        }
      });
    }
  );

  console.log(`Collaboration websocket mounted on ${COLLAB_PATH}/:roomId`);
};
