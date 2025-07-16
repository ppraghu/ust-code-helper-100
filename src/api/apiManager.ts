import { ChatMessage, ModelHost } from "../utils/types";
import { Settings } from "../config/settings";
import { OpenAIAPI } from "./openai";
import { AzureOpenAiApi } from "./azureOpenAI";

export interface ApiClient {
    sendMessage(message: string, contextFiles?: Map<string, string>): Promise<string>;
    sendChatMessages(messages: ChatMessage[], contextFiles?: Map<string, string>): Promise<string>;
}

export class ApiManager {

    private static ApiClient: ApiClient;

    static async getApiClient() : Promise<ApiClient> {

        if(!this.ApiClient){
            await this.setApiClient();
        }
        
        return this.ApiClient;
    }

    private static async setApiClient() {
        
        var host = await Settings.getHost();

        if(host === ModelHost.OpenAI){
            this.ApiClient = new OpenAIAPI();
        }
        else if(host === ModelHost.AzureOpenAI) {
            this.ApiClient = new AzureOpenAiApi();
        }
        else {
            throw new Error("Model Host is not configured");
        }
    }
}