import { AsyncHook, isOk } from "../hooks/async-hook";
import { StorageLink } from "./storage-link";
import { Storage } from "../hooks/storage";

export const Breadcrumbs = (props: { storage: AsyncHook<Storage, string> }) => {
  if (isOk(props.storage)) {
    const storage = props.storage.data;
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
  }

  return <div className="max-w-xs text-sm breadcrumbs">Loading...</div>;
};
