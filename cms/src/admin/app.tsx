import {
  setPluginConfig,
  StrapiMediaLib,
  StrapiUploadAdapter,
} from "@_sh/strapi-plugin-ckeditor";
import {
  Alignment,
  Bold,
  Essentials,
  Heading,
  Image,
  ImageInsert,
  ImageToolbar,
  ImageUpload,
  Italic,
  Link,
  List,
  Paragraph,
  ShowBlocks,
  Strikethrough,
  Table,
  TableToolbar,
  Underline,
  WordCount,
} from "ckeditor5";
import type { PluginConfig } from "@_sh/strapi-plugin-ckeditor";

const myConfig: PluginConfig = {
  presets: [
    {
      name: "defaultHtml",
      description: "Default HTML editor",
      editorConfig: {
        licenseKey: "GPL",
        plugins: [
          Essentials,
          Bold,
          Italic,
          Underline,
          Strikethrough,
          Heading,
          List,
          Alignment,
          Link,
          Image,
          ImageInsert,
          ImageToolbar,
          ImageUpload,
          Table,
          TableToolbar,
          Paragraph,
          ShowBlocks,
          WordCount,
          StrapiMediaLib,
          StrapiUploadAdapter,
        ],
        toolbar: [
          "showBlocks",
          "|",
          "heading",
          "|",
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "|",
          "alignment",
          "bulletedList",
          "numberedList",
          "|",
          "link",
          "insertImage",
          "strapiMediaLib",
          "insertTable",
          "|",
          "undo",
          "redo",
        ],
        heading: {
          options: [
            {
              model: "paragraph" as const,
              title: "Paragraph",
              class: "ck-heading_paragraph",
            },
            {
              model: "heading2" as const,
              view: "h2",
              title: "Heading 2",
              class: "ck-heading_heading2",
            },
            {
              model: "heading3" as const,
              view: "h3",
              title: "Heading 3",
              class: "ck-heading_heading3",
            },
            {
              model: "heading4" as const,
              view: "h4",
              title: "Heading 4",
              class: "ck-heading_heading4",
            },
          ],
        },
        image: {
          toolbar: ["imageTextAlternative"],
        },
        table: {
          contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
        },
      },
    },
  ],
};

export default {
  config: {
    locales: ["fr"],
  },
  register() {
    setPluginConfig(myConfig);
  },
  bootstrap() {},
};
