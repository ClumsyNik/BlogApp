import React from "react";

interface Props {
  label: string;
  id: string;
  type: string;
  value?: string;
  checked?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  align?: "start" | "center" | "end";
}

const FormField = ({
  label,
  id,
  type,
  value,
  checked,
  onChange,
  accept,
  align = "start",
}: Props) => {
  return (
    <div className="mb-3">
      <label
        htmlFor={id}
        className={`form-label d-flex justify-content-${align}`}
      >
        {label}
      </label>

      {type === "checkbox" ? (
        <input
          type="checkbox"
          id={id}
          className="form-check-input"
          checked={checked}
          onChange={onChange}
        />
      ) : (
        <input
          type={type}
          id={id}
          className="form-control"
          value={type === "file" ? undefined : value}
          onChange={onChange}
          accept={accept}
        />
      )}
    </div>
  );
};

export default FormField;