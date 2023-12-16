import Link from "next/link";
import { Storage } from "../hooks/storage";

export const getStorageUrl = (storage: Pick<Storage, "id" | "path">) => {
  return `/?id=${storage.id}&path=${storage.path}`;
};

export const StorageLink = (props: {
  storage: Storage;
  children?: React.ReactNode;
}) => {
  return <Link href={getStorageUrl(props.storage)}>{props.children}</Link>;
};
