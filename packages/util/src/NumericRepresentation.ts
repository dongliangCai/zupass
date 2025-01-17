import { stringify } from "uuid";

/**
 * Converts a byte array to a hex string.  Opposite of fromHexString().
 */
export function toHexString(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

/**
 * Converts a hex string to a byte-array.  Opposite of toHexString().
 */
export function fromHexString(hexString: string): Uint8Array {
  return Buffer.from(hexString, "hex");
}

/**
 * Converts a number (as decimal string) to a UUID (as string) in the
 * format of uuid.stringify.
 */
export function decStringToBigIntToUuid(value: string): string {
  let hexStr = BigInt(value).toString(16);
  while (hexStr.length < 32) hexStr = "0" + hexStr;
  const buf = Buffer.from(hexStr, "hex");
  return stringify(buf);
}
