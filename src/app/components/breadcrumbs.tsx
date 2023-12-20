import { Metadata } from "../lib/messages";
import { StorageLink } from "./storage-link";

export const Breadcrumbs = (props: { storage: Metadata }) => {
  const storage = props.storage;
  const parts = storage.prefix.split("/").filter((item) => !!item);
  parts.unshift("");
  const crumbs = parts.map((name, index) => {
    name = name.length === 0 ? "/" : name;
    let path = parts.slice(0, index + 1).join("/");
    path = path.length === 0 ? "/" : path;
    return {
      ...storage,
      name,
      path,
    };
  });

  return (
    <div className="max-w-xs text-sm breadcrumbs">
      <ul>
        {crumbs.map((crumb) => {
          return (
            <li key={crumb.path} className="before:text-accent">
              <StorageLink metadata={crumb}>{crumb.name}</StorageLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
