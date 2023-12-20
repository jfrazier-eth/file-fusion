import { ForwardedRef, forwardRef } from "react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
}

export const TextInput = forwardRef(
  (props: TextInputProps, ref: ForwardedRef<HTMLInputElement>) => {
    return (
      <label className="form-control w-full">
        <div className="label pb-1 pt-1">
          <span className="label-text text-xs">{props.label}</span>
        </div>
        <input
          ref={ref}
          type="text"
          placeholder={props.placeholder}
          value={props.value}
          onChange={(e) => {
            props.onChange(e.target.value);
          }}
          className="input input-bordered input-xs rounded-sm grow"
        />
      </label>
    );
  },
);
TextInput.displayName = "TextInput";
