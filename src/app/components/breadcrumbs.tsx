import { StorageLink } from "./storage-link";
import { Storage } from "../hooks/storage";

export const Breadcrumbs = (props: { storage: Storage }) => {
  const storage = props.storage;
  const parts = storage.path.split("/").filter((item) => !!item);
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
              <StorageLink storage={crumb}>{crumb.name}</StorageLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
