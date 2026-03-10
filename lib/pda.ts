import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PIGEON_HOUSE_PROGRAM_ID, PIGEON_MINT, HOOK_PROGRAM_ID } from "./constants";

export function getGlobalConfigPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pigeon_house_config")],
    PIGEON_HOUSE_PROGRAM_ID
  );
  return pda;
}

export function getBondingCurvePDA(tokenMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding_curve"), tokenMint.toBuffer()],
    PIGEON_HOUSE_PROGRAM_ID
  );
  return pda;
}

export function getFeeVaultPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("fee_vault")],
    PIGEON_HOUSE_PROGRAM_ID
  );
  return pda;
}

export function getMetadataPDA(tokenMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
      tokenMint.toBuffer(),
    ],
    new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
  );
  return pda;
}

export function getATA(
  owner: PublicKey,
  mint: PublicKey,
  programId = TOKEN_2022_PROGRAM_ID
): PublicKey {
  return getAssociatedTokenAddressSync(mint, owner, true, programId);
}

// ── Quote Asset PDAs ──

export function getQuoteAssetConfigPDA(quoteMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("quote_asset"), quoteMint.toBuffer()],
    PIGEON_HOUSE_PROGRAM_ID
  );
  return pda;
}

export function getStrategicReservePDA(quoteMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("strategic_reserve"), quoteMint.toBuffer()],
    PIGEON_HOUSE_PROGRAM_ID
  );
  return pda;
}

export function getBurnAccrualPDA(quoteMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("burn_accrual"), quoteMint.toBuffer()],
    PIGEON_HOUSE_PROGRAM_ID
  );
  return pda;
}

// ── Hook Program PDAs ──

export function getHookConfigPDA(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("hook_config")],
    HOOK_PROGRAM_ID
  );
  return pda;
}

export function getFeeAccrualVaultPDA(tokenMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("fee_accrual"), tokenMint.toBuffer()],
    HOOK_PROGRAM_ID
  );
  return pda;
}

export function getExtraAccountMetasPDA(tokenMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), tokenMint.toBuffer()],
    HOOK_PROGRAM_ID
  );
  return pda;
}


