import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface KeyBinding {
  metaKey: boolean;
  key: string;
  description: string;
}

const config = {
  back: {
    metaKey: true,
    key: "[",
    description: "Navigate to the previous page",
  },
  forward: {
    metaKey: true,
    key: "]",
    description: "Navigate to the previous page",
  },
  newStorage: {
    metaKey: true,
    key: "n",
    description: "Open the new storage modal",
  },
} satisfies Record<string, KeyBinding>;

const entries = <K extends string, T>(o: Record<K, T>): [K, T][] => {
  return Object.entries(o) as [K, T][];
};

interface Props {
  toggleNewStorageModal: () => void;
}

export const useKeyBindings = ({ toggleNewStorageModal }: Props) => {
  const router = useRouter();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const items = entries<keyof typeof config, KeyBinding>(config);
      for (const [name, kb] of items) {
        if (kb.metaKey === event.metaKey && kb.key === event.key) {
          switch (name) {
            case "back": {
              router.back();
              break;
            }
            case "forward": {
              router.forward();
              break;
            }
            case "newStorage": {
              toggleNewStorageModal();
              break;
            }
          }
        }
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [router, toggleNewStorageModal]);
};
