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
  newFolder: {
    metaKey: true,
    key: "n",
    description: "Open the new folder modal",
  },
  newStorage: {
    metaKey: true,
    key: "s",
    description: "Open the new storage modal",
  },
} satisfies Record<string, KeyBinding>;

const entries = <K extends string, T>(o: Record<K, T>): [K, T][] => {
  return Object.entries(o) as [K, T][];
};

interface Props {
  toggleNewFolderModal: () => void;
  toggleNewStorageModal: () => void;
}

export const useKeyBindings = ({
  toggleNewFolderModal,
  toggleNewStorageModal,
}: Props) => {
  const router = useRouter();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const items = entries<keyof typeof config, KeyBinding>(config);
      console.log(`Key press Meta: ${event.metaKey} Key: ${event.key}`);
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
            case "newFolder": {
              toggleNewFolderModal();
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
  }, [router]);
};
