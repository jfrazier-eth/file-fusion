"use client";
import { invoke } from "@tauri-apps/api/tauri";
import { useQuery } from "@tanstack/react-query";

export const useHomeDir = () => {
  const query = useQuery({
    queryKey: ["home_dir"],
    queryFn: () => invoke<string>("home_dir"),
  });

  return { query };
};
