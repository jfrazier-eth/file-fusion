import { AsyncHook, isOk } from "../hooks/async-hook";
import { StorageLink } from "./storage-link";
import { Storage } from "../hooks/storage";

export const Breadcrumbs = (props: { storage: AsyncHook<Storage, string> }) => {
  if (isOk(props.storage)) {
    const storage = props.storage.data;
    const parts = storage.path.split("/");
    const crumbs = parts.map((name, index) => {
      return {
        ...storage,
        name,
        path: parts.slice(0, index + 1).join("/"),
      };
    });

    return (
      <div className="max-w-xs text-sm breadcrumbs">
        <ul>
          {crumbs.map((crumb) => {
            return (
              <li key={crumb.path}>
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