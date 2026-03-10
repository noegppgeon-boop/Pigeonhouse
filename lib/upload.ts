"use client";

import { WebUploader } from "@irys/web-upload";
import { WebSolana } from "@irys/web-upload-solana";
import { RPC_URL } from "./constants";

export interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string; // URL or will be uploaded
  external_url?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

/**
 * Get an Irys uploader instance connected to the user's wallet
 */
async function getIrys(wallet: { provider: any }) {
  const isDevnet = RPC_URL.includes("devnet");
  const builder = WebUploader(WebSolana).withProvider(wallet.provider).withRpc(RPC_URL);
  const irys = isDevnet ? await builder.devnet() : await builder;
  return irys;
}

/**
 * Upload an image file to Arweave via Irys
 * Returns the Arweave URL
 */
export async function uploadImage(
  wallet: { provider: any },
  file: File
): Promise<string> {
  const irys = await getIrys(wallet);

  // Fund if needed (check balance first)
  const size = file.size;
  const price = await irys.getPrice(size);
  const balance = await irys.getBalance();

  if (balance.lt(price)) {
    // Fund with 1.5x the price for safety margin
    const fundAmount = price.multipliedBy(1.5).integerValue();
    await irys.fund(fundAmount);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const receipt = await irys.upload(buffer, {
    tags: [{ name: "Content-Type", value: file.type }],
  });

  return `https://arweave.net/${receipt.id}`;
}

/**
 * Upload token metadata JSON to Arweave via Irys
 * Returns the Arweave URI for on-chain metadata
 */
export async function uploadMetadata(
  wallet: { provider: any },
  metadata: TokenMetadata,
  imageUrl?: string
): Promise<string> {
  const irys = await getIrys(wallet);

  const metadataJson = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description || "",
    image: imageUrl || metadata.image || "",
    external_url: metadata.external_url || metadata.website || "",
    properties: {
      links: {
        ...(metadata.twitter && { twitter: metadata.twitter }),
        ...(metadata.telegram && { telegram: metadata.telegram }),
        ...(metadata.website && { website: metadata.website }),
      },
    },
  };

  const data = JSON.stringify(metadataJson);

  // Fund if needed
  const price = await irys.getPrice(Buffer.byteLength(data));
  const balance = await irys.getBalance();

  if (balance.lt(price)) {
    const fundAmount = price.multipliedBy(1.5).integerValue();
    await irys.fund(fundAmount);
  }

  const receipt = await irys.upload(data, {
    tags: [{ name: "Content-Type", value: "application/json" }],
  });

  return `https://arweave.net/${receipt.id}`;
}

/**
 * Upload image file + metadata in one go
 * Returns the metadata URI for on-chain use
 */
export async function uploadTokenAssets(
  wallet: { provider: any },
  metadata: TokenMetadata,
  imageFile?: File
): Promise<string> {
  let imageUrl = metadata.image;

  // Upload image first if file provided
  if (imageFile) {
    imageUrl = await uploadImage(wallet, imageFile);
  }

  // Upload metadata JSON
  const metadataUri = await uploadMetadata(wallet, metadata, imageUrl);
  return metadataUri;
}
