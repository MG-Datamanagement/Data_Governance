declare module "react-quill" {
  import * as React from "react";

  export interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    onChange?: (
      content: string,
      delta: any,
      source: string,
      editor: any
    ) => void;
    readOnly?: boolean;
    theme?: string;
    modules?: any;
    formats?: string[];
    bounds?: string | HTMLElement;
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
  }

  const ReactQuill: React.ComponentType<ReactQuillProps>;
  export default ReactQuill;
}
