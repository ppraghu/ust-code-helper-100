import * as vscode from "vscode";
import { Settings } from "../config/settings";
import { getWebviewContent } from "./webviewContent";
import { DatabaseService } from "../services/DatabaseService";
import { ApiManager } from "../api/apiManager";

export class WebviewManager {
  private static instance: WebviewManager;
  private dbService!: DatabaseService;
  private currentSessionId?: number;
  private panel?: vscode.WebviewPanel;
  private contextFiles: Map<string, string> = new Map();

  constructor(private context: vscode.ExtensionContext) {
    WebviewManager.instance = this;
  }

  static getInstance(): WebviewManager | undefined {
    return WebviewManager.instance;
  }

  async show(sessionId?: number) {
    try {
      console.log("[WebviewManager] Show called with sessionId:", sessionId);

      // Initialize database first
      this.dbService = await DatabaseService.getInstance(this.context);

      // Create or get panel
      if (!this.panel) {
        console.log("[WebviewManager] Creating new panel");
        this.panel = vscode.window.createWebviewPanel(
          "customAiChat",
          "Custom AI Chat",
          vscode.ViewColumn.Two,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
          }
        );

        this.panel.onDidDispose(() => {
          this.panel = undefined;
          console.log("Panel disposed");
        });

        this.panel.webview.html = getWebviewContent();
        this.setupMessageHandling();
      }

      // Always reveal the panel
      this.panel.reveal();

      // Handle session after panel is created
      if (sessionId) {
        // Load existing session
        this.currentSessionId = sessionId;
        console.log("[WebviewManager] Loading existing session:", sessionId);
        const chatMessages = await this.dbService.loadChatSession(sessionId);
        console.log("[WebviewManager] Loaded chat messages:", chatMessages);
        if (chatMessages) {
          console.log("Sending messages to webview:", chatMessages);
          // Clear existing chat first
          this.panel.webview.postMessage({ command: "clearChat" });
          // Then load the previous chat
          this.panel.webview.postMessage({
            command: "loadPreviousChat",
            messages: chatMessages,
          });
        }
      } else {
        // Create new chat session
        const title = new Date().toLocaleString();
        const newSessionId = await this.dbService.createChatSession(title);
        if (!newSessionId) {
          throw new Error("Failed to create new chat session");
        }
        this.currentSessionId = newSessionId;
        console.log(
          "[WebviewManager] Created new session with ID:",
          this.currentSessionId
        );
      }

      await this.updateModelDisplay();
    } catch (error) {
      console.error("[WebviewManager] Error:", error);
      throw error; // Let the error propagate
    }
  }

  private async updateModelDisplay() {
    const currentModel = await Settings.getCurrentModel();
    if (this.panel) {
      this.panel.webview.postMessage({
        command: "updateModel",
        model: currentModel,
      });
    }
  }

  private setupMessageHandling() {
    this.panel?.webview.onDidReceiveMessage(
      async (message) => {
        console.log("[WebviewManager] Received message:", message);
        switch (message.command) {
          case "newChat":
            try {
              // Create new chat session
              const title = new Date().toLocaleString();
              const newSessionId = await this.dbService.createChatSession(
                title
              );
              this.currentSessionId = newSessionId;

              // Clear the chat in webview
              this.panel?.webview.postMessage({
                command: "clearChat",
                newSession: true, // Add this flag
              });

              console.log(
                "[WebviewManager] Created new chat session:",
                newSessionId
              );
            } catch (error) {
              console.error("[WebviewManager] Error creating new chat:", error);
              vscode.window.showErrorMessage(
                "Failed to create new chat session"
              );
            }
            break;

          case "sendMessage":
            try {
              const response = await (await ApiManager.getApiClient()).sendChatMessages(
                message.messages,
                this.contextFiles
              );

              // Send response to webview
              this.panel?.webview.postMessage({
                command: "receiveResponse",
                text: response,
              });

              // Wait for the webview to send back the updated messages
              this.panel?.webview.postMessage({
                command: "requestMessages",
              });
            } catch (error: any) {
              vscode.window.showErrorMessage(`Error: ${error.message}`);
              this.panel?.webview.postMessage({
                command: "receiveResponse",
                text: `Error: ${error.message}`,
              });
            }
            break;

          case "updateMessages":
            if (this.currentSessionId && message.messages) {
              console.log(
                "[WebviewManager] Received messages update:",
                message.messages
              );
              await this.dbService.updateChatSession(
                this.currentSessionId,
                message.messages
              );
            }
            break;

          case "changeModel":
            const newModel = await Settings.selectModel();
            if (newModel) {
              this.updateModelDisplay();
            }
            break;
          case "removeFromContext":
            this.contextFiles.delete(message.file);
            this.panel?.webview.postMessage({
              command: "updateContext",
              files: Array.from(this.contextFiles.keys()),
            });
            break;
          case "clearContext":
            this.contextFiles.clear();
            this.panel?.webview.postMessage({
              command: "updateContext",
              files: [],
            });
            break;
          case "saveChat":
            if (this.currentSessionId) {
              console.log(
                "[WebviewManager] Saving chat for session:",
                this.currentSessionId
              );
              await this.dbService.updateChatSession(
                this.currentSessionId,
                message.messages
              );
            } else {
              console.log("[WebviewManager] No current session ID!");
            }
            break;
          case "showHistory":
            await vscode.commands.executeCommand(
              "ust-code-helper-100.showChatHistory"
            );
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  public async saveChatMessages(messages: any[]) {
    if (this.currentSessionId) {
      await this.dbService.saveChat(messages, this.currentSessionId);
    }
  }

  async addToContext(uri: vscode.Uri) {
    const files = await this.listAllFiles(uri);
    for(const file of files) {
      await this.addFileToContext(file);
    }
  }

  async addFileToContext(uri: vscode.Uri): Promise<void> {
    const relativePath = vscode.workspace.asRelativePath(uri);
    const fileContent = await vscode.workspace.fs.readFile(uri);
    const contentText = Buffer.from(fileContent).toString("utf8");

    this.contextFiles.set(relativePath, contentText);

    this.panel?.webview.postMessage({
      command: "updateContext",
      files: Array.from(this.contextFiles.keys()),
    });
  }

  async listAllFiles(uri: vscode.Uri): Promise<vscode.Uri[]> {
    let allFiles: vscode.Uri[] = [];
  
    async function traverseDirectory(directoryUri: vscode.Uri) {
      const entries = await vscode.workspace.fs.readDirectory(directoryUri);
  
      for (const [name, type] of entries) {
        const entryUri = vscode.Uri.joinPath(directoryUri, name);
  
        if (type === vscode.FileType.File) {
          allFiles.push(entryUri); // Add file path to the list
        } 
        else if (type === vscode.FileType.Directory) {
          await traverseDirectory(entryUri); // Recurse into subdirectory
        }
      }
    }
  
    try {
      const stat = await vscode.workspace.fs.stat(uri);
  
      if (stat.type === vscode.FileType.Directory) {
        await traverseDirectory(uri);
      } 
      else if(stat.type === vscode.FileType.File) {
        allFiles.push(uri);
      }
      else {
        vscode.window.showErrorMessage(`${uri.fsPath} is not a file or directory.`);
      }
    } catch (error : Error | any) {
      vscode.window.showErrorMessage(`Error reading directory: ${error.message}`);
    }
  
    return allFiles;
  }
  
}
