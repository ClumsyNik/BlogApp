import React from "react";

interface Props {
  label?: string;
  id: string;
  type?: string;
  value?: string;
  checked?: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  accept?: string;
  align?: "start" | "center" | "end";
  classname?: string;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}

const FormField = ({
  label,
  id,
  type = "text",
  value,
  checked,
  onChange,
  accept,
  align = "start",
  classname = "",
  placeholder,
  textarea = false,
  rows = 4,
}: Props) => {
  return (
    <div className="mb-3 w-100">
      {label && (
        <label
          htmlFor={id}
          className={`form-label d-flex justify-content-${align}`}
        >
          {label}
        </label>
      )}

      {textarea ? (
        <textarea
          id={id}
          className={`form-control ${classname}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={rows}
        />
      ) : type === "checkbox" ? (
        <input
          placeholder={placeholder}
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className={classname}
        />
      ) : (
        <input
          placeholder={placeholder}
          type={type}
          id={id}
          className={`form-control ${classname}`}
          value={type === "file" ? undefined : value}
          onChange={onChange}
          accept={accept}
        />
      )}
    </div>
  );
};

export default FormField;
