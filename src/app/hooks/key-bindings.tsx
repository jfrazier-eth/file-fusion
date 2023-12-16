import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
} as const;

export const useKeyBindings = () => {
  const router = useRouter();
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const items = Object.entries(config);

      for (const [name, kb] of items) {
        if (kb.metaKey === event.metaKey && kb.key === event.key) {
          switch (name) {
            case "back": {
              router.back();
            }
            case "forward": {
              router.forward();
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
