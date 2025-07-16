import * as vscode from "vscode";
import { DatabaseService, ChatSession } from "../services/DatabaseService";

export class ChatHistoryView {
  private static readonly viewType = "chatHistory";
  private panel: vscode.WebviewPanel | undefined;
  private dbService!: DatabaseService;

  constructor(private context: vscode.ExtensionContext) {
    this.initialize();
  }

  private async initialize() {
    this.dbService = await DatabaseService.getInstance(this.context);
  }

  public async show() {
    try {
      this.panel = vscode.window.createWebviewPanel(
        ChatHistoryView.viewType,
        "Chat History",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      const sessions = await this.dbService.getChatSessions();
      this.panel.webview.html = this.getWebviewContent(sessions);

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });

      this.panel.webview.onDidReceiveMessage(async (message) => {
        console.log("[ChatHistoryView] Received message:", message);

        switch (message.command) {
          case "openChat":
            const sessionId = parseInt(message.sessionId, 10);
            console.log(
              "[ChatHistoryView] Opening chat with sessionId:",
              sessionId
            );
            if (!isNaN(sessionId)) {
              await vscode.commands.executeCommand(
                "ust-code-helper-100.startChat",
                sessionId
              );
              this.panel?.dispose();
            } else {
              console.error(
                "[ChatHistoryView] Invalid sessionId:",
                message.sessionId
              );
            }
            break;

          case "confirmDelete":
            console.log(
              "[ChatHistoryView] Confirming delete for sessionId:",
              message.sessionId
            );
            const answer = await vscode.window.showWarningMessage(
              "Are you sure you want to delete this chat?",
              { modal: true },
              "Yes",
              "No"
            );
            console.log(
              "[ChatHistoryView] Delete confirmation answer:",
              answer
            );

            if (answer === "Yes") {
              try {
                console.log(
                  "[ChatHistoryView] Proceeding with deletion of sessionId:",
                  message.sessionId
                );
                await this.dbService.deleteChatSession(message.sessionId);
                console.log("[ChatHistoryView] Successfully deleted session");

                // Refresh the view
                await this.refreshSessions();
                vscode.window.showInformationMessage(
                  "Chat deleted successfully"
                );
              } catch (error) {
                console.error(
                  "[ChatHistoryView] Error deleting session:",
                  error
                );
                vscode.window.showErrorMessage("Failed to delete chat");
              }
            }
            break;

          default:
            console.log("[ChatHistoryView] Unknown command:", message.command);
        }
      });
    } catch (error) {
      console.error("[ChatHistoryView] Error showing chat history:", error);
      vscode.window.showErrorMessage("Failed to show chat history");
    }
  }

  private getWebviewContent(sessions: ChatSession[]): string {
    const sessionsList = sessions
      .map(
        (session) => `
      <div class="chat-session">
        <div class="session-info">
          <div class="session-title">${session.title}</div>
          <div class="session-message">${session.lastMessage}</div>
          <div class="session-date">${new Date(
            session.updated_at
          ).toLocaleString()}</div>
        </div>
        <div class="session-actions">
          <button class="open-button" onclick="openChat(${
            session.id
          })">Open</button>
          <button class="delete-button" onclick="confirmDelete(${
            session.id
          })">Delete</button>
        </div>
      </div>
    `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .chat-session {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 10px;
              border-bottom: 1px solid var(--vscode-input-border);
            }
            .session-info {
              flex: 1;
            }
            .session-title {
              font-weight: bold;
              margin-bottom: 4px;
            }
            .session-message {
              font-size: 12px;
              color: var(--vscode-descriptionForeground);
              margin-bottom: 4px;
            }
            .session-date {
              font-size: 10px;
              color: var(--vscode-descriptionForeground);
            }
            .session-actions {
              display: flex;
              gap: 8px;
            }
            .delete-button {
              background-color: var(--vscode-errorForeground);
              color: white;
              border: none;
              padding: 4px 8px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 11px;
            }
            .open-button {
              background-color: var(--vscode-button-background);
              color: var(--vscode-button-foreground);
              border: none;
              padding: 4px 8px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div id="sessions-list">
            ${sessionsList}
          </div>
          <script>
            const vscode = acquireVsCodeApi();
            
            function openChat(sessionId) {
              vscode.postMessage({
                command: 'openChat',
                sessionId: sessionId
              });
            }

            function confirmDelete(sessionId) {
              vscode.postMessage({
                command: 'confirmDelete',
                sessionId: sessionId
              });
            }
          </script>
        </body>
      </html>
    `;
  }

  private async handleMessage(message: any) {
    switch (message.command) {
      case "openChat":
        await vscode.commands.executeCommand(
          "ust-code-helper-100.startChat",
          message.sessionId
        );
        break;
      case "confirmDelete":
        const answer = await vscode.window.showWarningMessage(
          "Are you sure you want to delete this chat?",
          { modal: true },
          "Yes",
          "No"
        );
        if (answer === "Yes") {
          try {
            const dbService = await DatabaseService.getInstance(this.context);
            await dbService.deleteChatSession(message.sessionId);
            // Refresh the view
            await this.refreshSessions();
            vscode.window.showInformationMessage("Chat deleted successfully");
          } catch (error) {
            vscode.window.showErrorMessage("Failed to delete chat");
          }
        }
        break;
    }
  }

  private async refreshSessions() {
    console.log("[ChatHistoryView] Refreshing sessions");
    const dbService = await DatabaseService.getInstance(this.context);
    const sessions = await dbService.getChatSessions();
    console.log("[ChatHistoryView] Got updated sessions:", sessions.length);
    if (this.panel) {
      this.panel.webview.html = this.getWebviewContent(sessions);
    }
  }
}
