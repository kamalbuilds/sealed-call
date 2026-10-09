export const SEALED_CALL_ERRORS: Record<number, string> = {
  6000: "Seal does not match the pool and token configuration",
  6001: "Pool fill would exceed maximum price impact",
  6002: "Reveal deadline has passed, cannot process",
  6003: "Caller lock period has not expired",
  6004: "Vault has insufficient balance",
  6005: "Position does not exist or is invalid",
  6006: "Unauthorized access to position or call",
  6007: "Pool data is invalid or corrupted",
  6008: "Invalid pool pairing, must be wSOL base",
  6009: "Caller has insufficient stake",
  6010: "Reveal window not yet open",
  6011: "Call already revealed",
  6012: "Invalid configuration parameters",
};

export function mapProgramError(error: any): string {
  if (error?.code) {
    const mapped = SEALED_CALL_ERRORS[error.code];
    if (mapped) return mapped;
  }

  if (error?.message) {
    if (error.message.includes("Instruction discrimination mismatch")) {
      return "Invalid program instruction";
    }
    return error.message;
  }

  return "An unknown error occurred";
}
