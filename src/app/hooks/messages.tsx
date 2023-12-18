import { invoke } from "@tauri-apps/api/tauri";
import { Messages } from "../lib/messages";

const update = (message: Messages) => {
  return invoke("update", {
    message,
  });
};

export const useMessages = () => {
  return {
    update,
  };
};
