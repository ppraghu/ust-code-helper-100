import * as vscode from "vscode";
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "./models";
import { ModelHost } from "../utils/types";

export class Settings {
  private static readonly CONFIG_SECTION = "customAiChat";

  static async getApiKey(): Promise<string | undefined> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    let apiKey = config.get<string>("apiKey");

    if (!apiKey) {
      apiKey = await vscode.window.showInputBox({
        prompt: "Please enter your OpenAI API key",
        password: true,
      });

      if (apiKey) {
        await config.update("apiKey", apiKey, true);
      }
    }

    return apiKey;
  }

  static async getBaseUrl(): Promise<string> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>("baseUrl") || "https://api.openai.com";
  }

  static async getUser(): Promise<string> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>("user") || "vscode-user";
  }
  static async getHost() : Promise<ModelHost> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    var value = config.get<string>("modelHost");
    return ModelHost[value as keyof typeof ModelHost];
  }
  static async getDeploymentName() : Promise<string> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    let deploymentName = config.get<string>("deploymentName");

    if (!deploymentName) {
      deploymentName = await vscode.window.showInputBox({
        prompt: "Please enter your AzureOpenAI deployment name",
        password: false,
      });

      if (deploymentName) {
        await config.update("deploymentName", deploymentName, true);
      }
      else {
        throw new Error("Must provide deployment name for Azure OpenAI host");
      }
    }
    return deploymentName;
  }
  static async getApiVersion() : Promise<string> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>("apiVersion") || '2024-08-01-preview';
  }
  static async getCurrentModel(): Promise<string> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    return config.get<string>("model") || DEFAULT_MODEL;
  }

  static async setCurrentModel(model: string): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_SECTION);
    await config.update("model", model, true);
  }

  static async selectModel(): Promise<string | undefined> {
    const models = AVAILABLE_MODELS.map((model) => ({
      label: model.name,
      description: model.description,
      detail: `Max tokens: ${model.maxTokens}`,
      id: model.id,
    }));

    const selected = await vscode.window.showQuickPick(models, {
      placeHolder: "Select AI Model",
    });

    if (selected) {
      await this.setCurrentModel(selected.id);
      return selected.id;
    }
    return undefined;
  }
}
