import Link from "next/link";
import { Metadata } from "../lib/messages";

export const getStorageUrl = (metadata: Pick<Metadata, "id" | "prefix">) => {
  return `/?id=${metadata.id}&prefix=${metadata.prefix}`;
};

export const StorageLink = (props: {
  metadata: Metadata;
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <Link href={getStorageUrl(props.metadata)} className={props.className}>
      {props.children}
    </Link>
  );
};
