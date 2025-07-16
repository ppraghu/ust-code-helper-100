import initSqlJs from "sql.js";
import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";

export interface ChatMessage {
  role: string;
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: number;
  title: string;
  lastMessage: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private db: any;
  private dbPath: string;
  private initialized = false;
  private context: vscode.ExtensionContext;
  private currentSessionId?: number;

  private constructor(context: vscode.ExtensionContext) {
    this.dbPath = path.join(context.globalStorageUri.fsPath, "chats.db");
    this.context = context;
  }

  private async initializeDatabase() {
    if (this.initialized) return;

    try {
      console.log("Starting database initialization...");
      console.log("__dirname:", __dirname);

      // Initialize with config
      const config = {
        locateFile: (filename: string) => {
          console.log("Attempting to locate file:", filename);
          if (filename.endsWith(".wasm")) {
            // Try multiple possible locations
            const possiblePaths = [
              path.join(__dirname, "sql-wasm.wasm"),
              path.join(__dirname, "..", "sql-wasm.wasm"),
              path.join(__dirname, "..", "dist", "sql-wasm.wasm"),
              path.join(this.context.extensionPath, "dist", "sql-wasm.wasm"),
            ];

            for (const wasmPath of possiblePaths) {
              console.log("Checking path:", wasmPath);
              if (fs.existsSync(wasmPath)) {
                console.log("Found WASM at:", wasmPath);
                return wasmPath;
              }
            }

            // Return the first path as fallback
            console.log("Falling back to:", possiblePaths[0]);
            return possiblePaths[0];
          }
          return filename;
        },
        nodeEnvironment: true,
      };

      console.log("About to initialize SQL.js with config:", config);

      // Use the imported sqlWasm instead of requiring it
      const SQL = await initSqlJs(config);

      if (!SQL || !SQL.Database) {
        throw new Error(
          "SQL.js initialization failed - Database constructor not available"
        );
      }

      console.log("SQL.js initialized successfully");

      // Create database directory if it doesn't exist
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      try {
        // Initialize database
        if (fs.existsSync(this.dbPath)) {
          console.log("Loading existing database");
          const data = fs.readFileSync(this.dbPath);
          this.db = new SQL.Database(data);

          // Drop and recreate tables to ensure correct schema
          this.db.run("DROP TABLE IF EXISTS chats");
          this.db.run("DROP TABLE IF EXISTS chat_sessions");
          this.db.run(`
            CREATE TABLE IF NOT EXISTS chat_sessions (
              id INTEGER PRIMARY KEY,
              title TEXT NOT NULL,
              last_message TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS chats (
              id INTEGER PRIMARY KEY,
              session_id INTEGER NOT NULL,
              messages TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
            );
          `);
          this.saveToFile();
        } else {
          console.log("Creating new database");
          this.db = new SQL.Database();
          this.db.run(`
            CREATE TABLE IF NOT EXISTS chat_sessions (
              id INTEGER PRIMARY KEY,
              title TEXT NOT NULL,
              last_message TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS chats (
              id INTEGER PRIMARY KEY,
              session_id INTEGER NOT NULL,
              messages TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(session_id) REFERENCES chat_sessions(id)
            );
          `);
          this.saveToFile();
        }

        // Verify tables exist
        const tables = this.db.exec(
          "SELECT name FROM sqlite_master WHERE type='table'"
        );
        console.log("Available tables:", tables);

        this.initialized = true;
        console.log("Database initialization complete");
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        throw dbError;
      }
    } catch (error) {
      console.error("Database initialization failed:", error);
      if (error instanceof Error) {
        console.error("Full error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      // Don't throw, allow the extension to work without persistence
    }
  }

  private saveToFile() {
    const data = this.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(this.dbPath, buffer);
  }

  public async saveChat(
    messages: ChatMessage[],
    sessionId: number
  ): Promise<void> {
    try {
      await this.initializeDatabase();
      if (!this.db) return;

      this.db.run("INSERT INTO chats (session_id, messages) VALUES (?, ?)", [
        sessionId,
        JSON.stringify(messages),
      ]);
      this.saveToFile();
    } catch (error) {
      console.error("Error saving chat:", error);
    }
  }

  public async loadLatestChat(): Promise<ChatMessage[] | null> {
    try {
      await this.initializeDatabase();
      if (!this.db) {
        throw new Error("Database not initialized");
      }

      const result = this.db.exec(
        "SELECT messages FROM chats ORDER BY created_at DESC LIMIT 1"
      );
      if (result.length && result[0].values.length) {
        return JSON.parse(result[0].values[0][0]);
      }
      return null;
    } catch (error) {
      console.error("Error loading latest chat:", error);
      return null;
    }
  }

  public getAllChats(): { id: number; messages: ChatMessage[] }[] {
    const result = this.db.exec(
      "SELECT id, messages FROM chats ORDER BY created_at DESC"
    );
    if (!result.length) return [];

    return result[0].values.map((row: any) => ({
      id: row[0],
      messages: JSON.parse(row[1]),
    }));
  }

  public static async getInstance(
    context?: vscode.ExtensionContext
  ): Promise<DatabaseService> {
    if (!DatabaseService.instance && context) {
      DatabaseService.instance = new DatabaseService(context);
      await DatabaseService.instance.initializeDatabase();
    }
    return DatabaseService.instance;
  }

  public async createChatSession(title: string): Promise<number> {
    await this.initializeDatabase();
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      // First, get the current max ID
      const maxIdResult = this.db.exec("SELECT MAX(id) FROM chat_sessions");
      const nextId = maxIdResult[0]?.values[0]?.[0]
        ? Number(maxIdResult[0].values[0][0]) + 1
        : 1;

      console.log("[DatabaseService] Next session ID will be:", nextId);

      // Insert new session with explicit ID
      this.db.run(
        "INSERT INTO chat_sessions (id, title, last_message) VALUES (?, ?, ?)",
        [nextId, title, ""]
      );

      this.saveToFile();
      console.log("[DatabaseService] Created new session with ID:", nextId);
      return nextId;
    } catch (error) {
      console.error("[DatabaseService] Error creating chat session:", error);
      throw new Error(
        `Failed to create chat session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public async getChatSessions(): Promise<ChatSession[]> {
    await this.initializeDatabase();
    const result = this.db.exec(
      "SELECT id, title, last_message, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC"
    );
    if (!result.length) return [];
    return result[0].values.map((row: any) => ({
      id: row[0],
      title: row[1],
      lastMessage: row[2],
      created_at: row[3],
      updated_at: row[4],
    }));
  }

  public async loadChatSession(
    sessionId: number
  ): Promise<ChatMessage[] | null> {
    await this.initializeDatabase();
    console.log("[DatabaseService] Loading chat session with ID:", sessionId);
    try {
      const result = this.db.exec(
        "SELECT messages FROM chats WHERE session_id = ? ORDER BY created_at DESC LIMIT 1",
        [sessionId]
      );

      if (result.length && result[0].values.length) {
        const messages = JSON.parse(result[0].values[0][0]);
        console.log("[DatabaseService] Loaded messages:", messages);
        return messages;
      }
      return null;
    } catch (error) {
      console.error("[DatabaseService] Error loading chat session:", error);
      return null;
    }
  }

  public async updateChatSession(
    sessionId: number,
    messages: ChatMessage[]
  ): Promise<void> {
    await this.initializeDatabase();
    if (!messages || messages.length === 0) {
      console.log("[DatabaseService] No messages to update");
      return;
    }

    try {
      // Update the session's metadata
      const lastMessage =
        messages[messages.length - 1]?.content?.substring(0, 100) || "";
      const title =
        messages[0]?.content?.substring(0, 50) + "..." || "New Chat";

      this.db.run(
        `UPDATE chat_sessions 
         SET last_message = ?, 
             title = CASE 
               WHEN title = '' THEN ? 
               ELSE title 
             END, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [lastMessage, title, sessionId]
      );

      // Insert the new chat entry
      this.db.run("INSERT INTO chats (session_id, messages) VALUES (?, ?)", [
        sessionId,
        JSON.stringify(messages),
      ]);

      this.saveToFile();
      console.log(
        "[DatabaseService] Successfully updated chat session:",
        sessionId
      );
    } catch (error) {
      console.error("[DatabaseService] Error updating chat session:", error);
      throw error;
    }
  }

  public async deleteChatSession(sessionId: number): Promise<void> {
    await this.initializeDatabase();
    try {
      // Delete all chat messages for this session
      this.db.run("DELETE FROM chats WHERE session_id = ?", [sessionId]);
      // Delete the session itself
      this.db.run("DELETE FROM chat_sessions WHERE id = ?", [sessionId]);
      this.saveToFile();
      console.log(
        "[DatabaseService] Successfully deleted chat session:",
        sessionId
      );
    } catch (error) {
      console.error("[DatabaseService] Error deleting chat session:", error);
      throw error;
    }
  }
}
