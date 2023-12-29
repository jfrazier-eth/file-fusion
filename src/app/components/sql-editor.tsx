import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { useQuery } from "../hooks/use-query";
import { UseBuffersResposne } from "../hooks/buffers";
import { UseQueryResult } from "@tanstack/react-query";
import { Schema } from "./schema";
import { useElementSize } from "../hooks/element-size";
import { useState } from "react";

interface Props {
  buffers: UseQueryResult<UseBuffersResposne, Error>;
}

export const SQLEditor = ({ buffers }: Props) => {
  const [containerRef, { width: containerWidth, height: containerHeight }] =
    useElementSize();
  const [sideBarRef, { width: sideBarWidth }] = useElementSize();

  const items: number[] = buffers.isSuccess
    ? buffers.data.map((item) => item.id)
    : [];
  const { statement, setStatement, run, results, buffer, setBuffer } = useQuery(
    "SELECT * FROM data;",
    items,
  );

  const [cursor, setCursor] = useState<{ column: number; row: number }>({
    column: statement.length,
    row: 0,
  });

  if (buffers.isError) {
    return <div className="flex flex-col">{buffers.error?.toString?.()}</div>;
  }

  if (buffers.isPending) {
    return <div className="flex flex-col">Loading...</div>;
  }

  return (
    <div
      className="flex flex-col max-w-full w-full h-full max-h-full overflow-clip"
      ref={containerRef}
    >
      <div className="flex flex-row">
        <div
          className={`flex flex-col mr-2 h-full max-h-[${containerHeight}px]`}
          ref={sideBarRef}
        >
          <select
            className="select select-sm mb-2 w-full max-w-xs rounded-none"
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setBuffer(value);
            }}
            value={buffer}
          >
            {buffers.data.map((item, index) => {
              return (
                <option key={item.id} value={item.id}>
                  {index + 1}: {item.name}
                </option>
              );
            })}
          </select>
          <div className="flex flex-col overflow-auto">
            <Schema
              buffer={buffer}
              onClick={(data) => {
                let rows = statement.split("\n");

                let content = rows
                  .map((row, index) => {
                    if (index === cursor.row) {
                      let prefix = row.slice(0, cursor.column).trimEnd();
                      let suffix = row.slice(cursor.column).trimStart();

                      return `${prefix} ${
                        data.includes(".") ? `"${data}"` : data
                      } ${suffix}`;
                    } else {
                      return row;
                    }
                  })
                  .join("\n");
                setStatement(content);
              }}
            />
          </div>
        </div>
        <div
          className={`max-h-[${containerHeight}px] max-w-[${
            containerWidth - sideBarWidth
          }px] flex flex-col h-full w-full`}
        >
          <AceEditor
            mode="sql"
            theme="monokai"
            onChange={(value) => {
              setStatement(value);
            }}
            fontSize={14}
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            className="h-40 max-h-40"
            width="100%"
            cursorStart={cursor.column}
            onCursorChange={(e) => {
              setCursor({ column: e.cursor.column, row: e.cursor.row });
            }}
            value={statement}
            editorProps={{ $blockScrolling: true }}
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              showLineNumbers: true,
              tabSize: 2,
            }}
          />
          <div className="h-16 bg-base-200 flex flex-row justify-between items-center px-2">
            <button className="btn btn-secondary btn-sm rounded-none" disabled>
              Explain
            </button>
            <button
              className="btn btn-primary btn-sm rounded-none"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                run();
              }}
            >
              Run
            </button>
          </div>

          <div className="mt-2 bg-base-200 grow overflow-auto w-full max-w-full">
            {results.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-2">Item</th>
                    {Object.keys(results[0]).map((key) => {
                      return (
                        <th className="" key={key}>
                          {key}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, index) => {
                    return (
                      <tr key={`${index}`}>
                        <th>{index + 1}</th>
                        {Object.values(row).map((value) => {
                          let data =
                            typeof value === "string" ||
                            typeof value === "number"
                              ? value
                              : JSON.stringify(value);

                          return (
                            <td className="w-3 max-w-3" key={data}>
                              {data}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
