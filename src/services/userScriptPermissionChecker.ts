import { sendMessageToBackground } from "@/lib/messages";
import browser from "./browser";

export interface UserScriptPermissionStatus {
  available: boolean;
  enabled: boolean;
  browser: "chrome" | "firefox" | "other";
  requiresToggle: boolean;
  toggleInstructions?: string;
  fallbackAvailable: boolean;
}

export class UserScriptPermissionChecker {
  private static instance: UserScriptPermissionChecker;

  static getInstance(): UserScriptPermissionChecker {
    if (!UserScriptPermissionChecker.instance) {
      UserScriptPermissionChecker.instance = new UserScriptPermissionChecker();
    }
    return UserScriptPermissionChecker.instance;
  }

  async checkPermissionStatus(): Promise<UserScriptPermissionStatus> {
    const browser = this.detectBrowser();

    if (browser === "chrome") {
      return this.checkChromeUserScriptsPermission();
    } else if (browser === "firefox") {
      return this.checkFirefoxFallback();
    } else {
      return this.checkGenericFallback();
    }
  }

  private detectBrowser(): "chrome" | "firefox" | "other" {
    try {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('chrome') && !userAgent.includes('firefox')) {
        return "chrome";
      } else if (userAgent.includes('firefox')) {
        return "firefox";
      }
    } catch (error) {
      console.debug("Error detecting browser:", error);
    }
    return "other";
  }

  private async checkChromeUserScriptsPermission(): Promise<UserScriptPermissionStatus> {
    // Check if userScripts API exists
    if (!browser.userScripts) {
      return {
        available: false,
        enabled: false,
        browser: "chrome",
        requiresToggle: true,
        toggleInstructions: this.getChromeToggleInstructions(),
        fallbackAvailable: true,
      };
    }

    // Check if userScripts permission is granted using browser.permissions API
    try {
      const hasPermission = await browser.permissions.contains({
        permissions: ["userScripts" as any],
      });

      if (hasPermission) {
        console.debug("UserScripts permission is granted");
        return {
          available: true,
          enabled: true,
          browser: "chrome",
          requiresToggle: false,
          fallbackAvailable: true,
        };
      } else {
        console.debug("UserScripts permission is not granted");
        return {
          available: true,
          enabled: false,
          browser: "chrome",
          requiresToggle: true,
          toggleInstructions: this.getChromeToggleInstructions(),
          fallbackAvailable: true,
        };
      }
    } catch (error) {
      console.debug("Error checking userScripts permission:", error);
      // If permissions API fails, assume permission is not available
      return {
        available: true,
        enabled: false,
        browser: "chrome",
        requiresToggle: true,
        toggleInstructions: this.getChromeToggleInstructions(),
        fallbackAvailable: true,
      };
    }
  }

  private async checkFirefoxFallback(): Promise<UserScriptPermissionStatus> {
    // Firefox doesn't have userScripts API, but we can fall back to eval/script injection
    return {
      available: false,
      enabled: false,
      browser: "firefox",
      requiresToggle: false,
      fallbackAvailable: true,
    };
  }

  private async checkGenericFallback(): Promise<UserScriptPermissionStatus> {
    // Generic browser fallback
    return {
      available: false,
      enabled: false,
      browser: "other",
      requiresToggle: false,
      fallbackAvailable: true,
    };
  }

  private getChromeToggleInstructions(): string {
    const version = this.getChromeVersion();

    if (version >= 138) {
      return `To enable userScripts:
1. Go to chrome://extensions
2. Click "Details" on this extension
3. Enable "Allow User Scripts" toggle`;
    } else {
      return `To enable userScripts:
1. Go to chrome://extensions
2. Enable "Developer mode" toggle`;
    }
  }

  private getChromeVersion(): number {
    try {
      const match = navigator.userAgent.match(/(Chrome|Chromium)\/([0-9]+)/);
      return match ? parseInt(match[2], 10) : 0;
    } catch {
      return 0;
    }
  }

  // Method to request userScripts permission
  async requestUserScriptsPermission(): Promise<boolean> {
    try {
      const granted = await browser.permissions.request({
        permissions: ["userScripts" as any],
      });
      return granted;
    } catch (error) {
      console.error("Error requesting userScripts permission:", error);
      return false;
    }
  }

  // Method to request permission status via background script
  async requestPermissionStatusFromBackground(): Promise<UserScriptPermissionStatus> {
    try {
      const response = await sendMessageToBackground("CHECK_USERSCRIPT_PERMISSION", null);
      return response || {
        available: false,
        enabled: false,
        browser: "chrome",
        requiresToggle: true,
        fallbackAvailable: true,
      };
    } catch (error) {
      // If messaging fails, fall back to client-side check
      return this.checkPermissionStatus();
    }
  }
}
