// Must be imported before any Supabase or crypto-dependent module.
// react-native-get-random-values v2.x uses TurboModuleRegistry (New Architecture)
// and sets global.crypto.getRandomValues. v2.0.0 does not include randomUUID,
// so we patch that too using the now-available getRandomValues.
import "react-native-get-random-values";

if (typeof global.crypto?.randomUUID !== "function") {
  (global.crypto as Crypto).randomUUID = function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
    const bytes = new Uint8Array(16);
    global.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
    const h = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}` as `${string}-${string}-${string}-${string}-${string}`;
  };
}
