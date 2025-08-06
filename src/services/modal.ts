export class ModalService {
  public static showModal(modalTitle: string, modalContent: string): void {
    const modalEvent = new CustomEvent("modalDispatch", {
      detail: {
        type: "customModal",
        data: { title: modalTitle, content: modalContent },
      },
    });
    window.dispatchEvent(modalEvent);
  }
}
