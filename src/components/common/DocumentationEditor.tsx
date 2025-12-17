"use client";

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
});

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const modules = {
  toolbar: [
    [{ size: ["small", false, "large", "huge"] }],
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

export default function DocumentationEditor({
  value,
  onChange,
  disabled,
}: Props) {
  return (
    <div className="border rounded-lg overflow-hidden glossary-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        readOnly={disabled}
        placeholder="Add documentation..."
      />
    </div>
  );
}
