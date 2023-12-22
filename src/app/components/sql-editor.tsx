import { useState } from "react";
import { Metadata } from "../lib/messages";
import { Modal } from "./modal";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-sql";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/ext-language_tools";

interface Query {
  statement: string;
  table: {
    locations: Metadata[];
  };
}

interface Props {
  isOpen: boolean;
  close: () => void;
}

export const SQLEditor = (props: Props) => {
  const [statement, setStatement] = useState("SELECT * FROM data;");

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
            <button className="btn btn-primary btn-sm rounded-none" disabled>
              Run
            </button>
          </div>
        </div>

        <div>
          <h2>Results</h2>
        </div>
      </div>
    </Modal>
  );
};
