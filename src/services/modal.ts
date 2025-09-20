import { FormFieldDefinition } from "@/components/formAction/FormBuilder";
import { generateId } from "@/utils/helpers";

export const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export interface ModalEventBaseDetail {
  id: string;
}
export interface ModalEventDetail extends ModalEventBaseDetail {
  type: "customModal" | "inputModal" | "formModal";
  data: any;
  nonce: number;
}

export interface InputModalResponseDetail {
  nonce: number;
  input?: string;
}

export interface FormModalResponseDetail {
  nonce: number;
  values?: Record<string, any>;
}

export class ModalService {
  private static modalId = () => generateId("modal");
  public static showModal({
    title,
    content,
  }: {
    title: string;
    content: string;
    callback?: (data: any) => void;
  }): string {
    const modalId = this.modalId();
    const modalEvent = new CustomEvent<ModalEventDetail>("modalDispatch", {
      detail: {
        id: modalId,
        type: "customModal",
        data: { title, content },
        nonce: 0, // Nonce not needed for custom modals
      },
    });
    window.dispatchEvent(modalEvent);
    return modalId;
  }

  public static async showInputModal({
    title,
  }: {
    title: string;
  }): Promise<any> {
    const nonce = Math.random();
    const modalId = this.modalId();
    const modalEvent = new CustomEvent<ModalEventDetail>("modalDispatch", {
      detail: {
        id: modalId,
        type: "inputModal",
        data: { title },
        nonce,
      },
    });
    window.dispatchEvent(modalEvent);
    return new Promise((resolve, reject) => {
      const handleResponse = (
        event: CustomEventInit<InputModalResponseDetail>,
      ) => {
        // Ensure the response is for the correct modal instance
        if (!event.detail || event.detail.nonce !== nonce) {
          return;
        }
        window.removeEventListener("inputModalResponse", handleResponse);
        if (!event.detail.input) {
          reject(new Error("Input modal was closed without submission"));
          return;
        }
        resolve({
          input: event.detail.input,
          timestamp: Date.now(),
        });
      };
      window.addEventListener("inputModalResponse", handleResponse);
      // Optional: Add a timeout to reject the promise if no response is received
      setTimeout(() => {
        window.removeEventListener("inputModalResponse", handleResponse);
        reject(new Error("Input modal response timed out"));
      }, TIMEOUT_DURATION);
    });
  }

  public static async showFormModal({
    title = "",
    fields,
  }: {
    title?: string;
    fields: FormFieldDefinition[];
  }): Promise<any> {
    const nonce = Math.random();
    const modalId = this.modalId();
    const modalEvent = new CustomEvent<ModalEventDetail>("modalDispatch", {
      detail: {
        id: modalId,
        type: "formModal",
        data: { fields, title },
        nonce,
      },
    });
    window.dispatchEvent(modalEvent);
    return new Promise((resolve, reject) => {
      const handleResponse = (
        event: CustomEventInit<FormModalResponseDetail>,
      ) => {
        // Ensure the response is for the correct modal instance
        if (!event.detail || event.detail.nonce !== nonce) {
          return;
        }
        window.removeEventListener("formModalResponse", handleResponse);
        if (!event.detail.values) {
          reject(new Error("Form modal was closed without submission"));
          return;
        }
        resolve(event.detail.values);
      };
      window.addEventListener("formModalResponse", handleResponse);
      // Optional: Add a timeout to reject the promise if no response is received
      setTimeout(() => {
        window.removeEventListener("formModalResponse", handleResponse);
        reject(new Error("Form modal response timed out"));
      }, TIMEOUT_DURATION);
    });
  }

  public static closeModal(modalId: string): void {
    const closeEvent = new CustomEvent<ModalEventBaseDetail>("modalClose", {
      detail: { id: modalId },
    });
    window.dispatchEvent(closeEvent);
  }

  public static closeAllModals(): void {
    const cleanupEvent = new CustomEvent("modalCleanup");
    window.dispatchEvent(cleanupEvent);
  }
}
