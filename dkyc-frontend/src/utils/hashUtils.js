import { keccak256, toUtf8Bytes } from "ethers";

export function computeCustomerId(name, dob) {
  return keccak256(toUtf8Bytes(`${name.trim()}|${dob.trim()}`));
}

export async function hashFile(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  return keccak256(bytes);
}
