import { HttpClientService } from "@/services/httpClient";
import { Account } from "./types/account";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiClient {
  private static instance: ApiClient;
  private httpClient: HttpClientService;

  private constructor() {
    this.httpClient = HttpClientService.getInstance();
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async getAccount(): Promise<Account> {
    const response = await this.httpClient.get(`${API_BASE_URL}/account`);
    if (!response.ok) {
      throw new Error(`Failed to fetch account: ${response.statusText}`);
    }
    return Account.parse(response.data); // Validate response data
  }
}
