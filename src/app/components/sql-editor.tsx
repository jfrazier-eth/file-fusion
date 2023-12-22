import { Modal } from "./modal";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";
import { useQuery } from "../hooks/use-query";

interface Props {
  isOpen: boolean;
  close: () => void;
  tables: string;
}

export const SQLEditor = (props: Props) => {
  const { statement, setStatement, run, results } = useQuery(
    "SELECT * FROM data;",
  );

  return (
    <Modal
      isOpen={props.isOpen}
      close={props.close}
      title="Editor"
      className="w-full min-w-[90%] min-h-[90%] m-2"
    >
      <div className="flex flex-col">
        <div className="flex flex-col w-full">
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
    </Modal>
  );
};
