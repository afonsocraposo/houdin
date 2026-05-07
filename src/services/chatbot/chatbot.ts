import { CustomMessage } from "@/lib/messages";
import browser from "../browser";
import { MessageType } from "@/types/messages";
export class ChatbotService {
  private static instance: ChatbotService;

  private constructor() {
    // Initialize any necessary properties here
  }

  public static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  init(): void {
    browser.runtime.onMessage.addListener((message: CustomMessage) => {
      switch (message.type) {
        case MessageType.RUN_CHAT:
          // Handle incoming chat messages here
          console.log("Received message for chatbot:", message.data);
          // You can process the message and send a response back if needed
          return;
        case MessageType.STOP_CHAT:
          // Handle chat stop messages here
          console.log("Received stop message for chatbot:", message.data);
          // You can implement logic to stop the chatbot response if needed
          return;
      }
    });
  }

  public async sendMessage(message: string): Promise<string> {
    // Implement the logic to send a message to the chatbot and receive a response
    // This is a placeholder implementation and should be replaced with actual API calls
    console.log(`Sending message to chatbot: ${message}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Chatbot response to: ${message}`);
      }, 1000);
    });
  }
}
