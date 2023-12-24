import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { useQuery } from "../hooks/use-query";
import { UseBuffersResposne } from "../hooks/buffers";
import { UseQueryResult } from "@tanstack/react-query";

interface Props {
  buffers: UseQueryResult<UseBuffersResposne, Error>;
}

export const SQLEditor = ({ buffers }: Props) => {
  const { statement, setStatement, run, results } = useQuery(
    "SELECT * FROM data;",
  );

  if (buffers.isError) {
    return <div className="flex flex-col">{buffers.error?.toString?.()}</div>;
  }

  if (buffers.isPending) {
    return <div className="flex flex-col">Loading...</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col w-full">
        <div>
          Buffers: {buffers.data.length}
          {buffers.data.map((item, index) => {
            return (
              <div key={item.id}>
                {index + 1}: {item.name}
              </div>
            );
          })}
        </div>
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
          <button className="btn btn-secondary btn-sm rounded-none">
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
      </div>

      <div>
        {results.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
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
                        typeof value === "string" || typeof value === "number"
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
  );
};
