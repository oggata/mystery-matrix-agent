import { ChatOpenAI } from "@langchain/openai";
import { config } from "../config/config.js";
import { logger } from "./logger.js";

// OpenAI model instance initialization
export const openai = new ChatOpenAI({
  openAIApiKey: config.openai.apiKey,
  modelName: config.openai.model,
  temperature: 0.7,
});

// Verify OpenAI API key
export async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    logger.debug('Verifying OpenAI API key');
    
    const testModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: config.openai.model
    });
    
    // Using a simple string array approach which is more compatible
    const response = await testModel.invoke([
      ["user", "Hello, this is a test message to verify the API key."]
    ]);
    
    return !!response;
  } catch (error) {
    logger.error('API key verification failed:', error);
    return false;
  }
}