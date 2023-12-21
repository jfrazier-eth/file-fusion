import Link from "next/link";
import { title } from "../constants";
import { Breadcrumbs } from "./breadcrumbs";
import { Metadata } from "../lib/messages";

export const Header = (props: {
  children?: React.ReactNode;
  metadata: Metadata;
}) => {
  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-row w-full items-center justify-between p-4 border-b border-primary">
        <div className="flex flex-row items-center justify-between">
          <div className="border-r pr-4 border-primary">
            <Link href="/">
              <h2 className="text-lg font-semibold">{title}</h2>
            </Link>
          </div>
          <h3 className="text-md font-semibold text-left ml-4">
            <Breadcrumbs storage={props.metadata} />
          </h3>
        </div>
        {props.children}
      </div>
    </div>
  );
};
