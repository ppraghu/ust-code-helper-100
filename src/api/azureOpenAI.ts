import * as https from "https";
import fetch from "node-fetch";
import * as fs from "fs";
import * as path from "path";
import { ChatMessage, APIResponse } from "../utils/types";
import { Settings } from "../config/settings";
import { ApiClient } from "./apiManager";
// Add at the top of your file
if (process.env.NODE_EXTRA_CA_CERTS) {
  process.env.NODE_EXTRA_CA_CERTS = "/path/to/your/certificate.pem";
}

export class AzureOpenAiApi implements ApiClient {
  private httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    ca: [
      // Add default certificates
      ...require("node:tls").rootCertificates,
      // You can add additional certificates if needed:
      // fs.readFileSync(path.join(__dirname, '../certs/your-cert.pem'))
    ],
    // Optionally add client certificates if required
    // cert: fs.readFileSync(path.join(__dirname, '../certs/client-cert.pem')),
    // key: fs.readFileSync(path.join(__dirname, '../certs/client-key.pem')),
  });

  async sendMessage(
    message: string,
    contextFiles?: Map<string, string>
  ): Promise<string> {
    const apiKey = await Settings.getApiKey();
    const baseUrl = await Settings.getBaseUrl();
    const deploymentName = await Settings.getDeploymentName();
    const apiVersion = await Settings.getApiVersion();

    if (!apiKey) {
      throw new Error("API key not configured");
    }

    // Add context files if available
    if (contextFiles && contextFiles.size > 0) {
      const contextMessage = Array.from(contextFiles.entries())
        .map(([path, content]) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``)
        .join("\n\n");
      message =
        "Here are context docs/files:\n" + contextMessage + "\n\n" + message;
    }

    const messages: ChatMessage[] = [{ role: "user", content: message }];

    const response = await fetch(`${baseUrl}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}}`, {
      method: "POST",
      agent: this.httpsAgent,
      headers: {
        "Content-Type": "application/json",
        "api-key": `${apiKey}`,
      },
      body: JSON.stringify({
        messages: messages
      }),
    });

    const data = (await response.json()) as APIResponse;

    if (!response.ok) {
      throw new Error(`API Error: ${data.error?.message || "Unknown error"}`);
    }

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from API");
    }

    return data.choices[0].message.content;
  }

  async sendChatMessages(
    messages: ChatMessage[],
    contextFiles?: Map<string, string>
  ): Promise<string> {
    const apiKey = await Settings.getApiKey();
    const baseUrl = await Settings.getBaseUrl();
    const deploymentName = await Settings.getDeploymentName();
    const apiVersion = await Settings.getApiVersion();

    if (!apiKey) {
      throw new Error("API key not configured");
    }

    // Add context files if available
    if (contextFiles && contextFiles.size > 0) {
      const contextMessage = Array.from(contextFiles.entries())
        .map(([path, content]) => `File: ${path}\n\`\`\`\n${content}\n\`\`\``)
        .join("\n\n");

      // Insert context as the first system message
      messages.unshift({
        role: "user",
        content: "Here are context docs/files:\n" + contextMessage,
      });
    }

    const response = await fetch(`${baseUrl}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`, {
      method: "POST",
      agent: this.httpsAgent,
      headers: {
        "Content-Type": "application/json",
        "api-key": `${apiKey}`,
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    const data = (await response.json()) as APIResponse;

    if (!response.ok) {
      throw new Error(`API Error: ${data.error?.message || "Unknown error"}`);
    }

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from API");
    }

    return data.choices[0].message.content;
  }
}
