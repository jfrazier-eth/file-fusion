import { useEffect } from "react";

interface KeyBinding {
  name: string;
  metaKey: boolean;
  key: string;
  description: string;
  onPress: () => void;
}

interface Props {
  bindings: KeyBinding[];
}

export const useKeyBindings = ({ bindings }: Props) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(event.metaKey, event.key);
      for (const kb of bindings) {
        if (kb.metaKey === event.metaKey && kb.key === event.key) {
          kb.onPress();
        }
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [bindings]);
};
