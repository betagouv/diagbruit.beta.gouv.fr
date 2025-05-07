import pako from "pako";

export const encode = (obj: any): string => {
  const json = JSON.stringify(obj);
  const binary = pako.deflate(json);
  const base64 = btoa(String.fromCharCode(...binary));
  return encodeURIComponent(base64); // safe for URLs
};

export const decode = (base64: string): any => {
  const binaryStr = atob(decodeURIComponent(base64));
  const binary = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
  const json = pako.inflate(binary, { to: "string" });
  return JSON.parse(json);
};
