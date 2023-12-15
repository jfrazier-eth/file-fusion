"use client";
import { invoke } from "@tauri-apps/api/tauri";
import { useAsyncHookState } from "./async-hook";

const load = () => {
  return invoke<string>("home_dir");
};

export const useHomeDir = () => {
  const { value: homeDir } = useAsyncHookState<string, string>(load);

  return homeDir;
};
