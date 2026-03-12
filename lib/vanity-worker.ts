/**
 * Vanity mint grinder — finds a Keypair whose base58 address ends with a target suffix.
 * Runs in the main thread (Web Workers can't import @solana/web3.js easily).
 * Uses batched generation with periodic yields to keep UI responsive.
 */

import { Keypair } from "@solana/web3.js";

const BATCH_SIZE = 500; // keypairs per batch before yielding

export interface GrindResult {
  keypair: Keypair;
  address: string;
  attempts: number;
  elapsedMs: number;
}

/**
 * Grind for a keypair whose base58 public key ends with `suffix`.
 * Case-sensitive (base58 is case-sensitive).
 * Returns a promise that resolves when found.
 *
 * @param suffix - Target suffix (e.g. "burn")
 * @param signal - Optional AbortSignal to cancel
 * @param onProgress - Called periodically with attempt count
 */
export async function grindVanityMint(
  suffix: string,
  signal?: AbortSignal,
  onProgress?: (attempts: number) => void
): Promise<GrindResult> {
  const start = Date.now();
  let attempts = 0;

  // Validate suffix is valid base58
  const base58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  for (const ch of suffix) {
    if (!base58Chars.includes(ch)) {
      throw new Error(`Invalid base58 character in suffix: '${ch}'`);
    }
  }

  return new Promise((resolve, reject) => {
    function batch() {
      if (signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      for (let i = 0; i < BATCH_SIZE; i++) {
        attempts++;
        const kp = Keypair.generate();
        const addr = kp.publicKey.toBase58();

        if (addr.endsWith(suffix)) {
          const elapsedMs = Date.now() - start;
          resolve({ keypair: kp, address: addr, attempts, elapsedMs });
          return;
        }
      }

      onProgress?.(attempts);
      // Yield to event loop to keep UI responsive
      setTimeout(batch, 0);
    }

    batch();
  });
}
