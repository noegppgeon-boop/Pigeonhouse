"use client";

export default function PrivacyPage() {
  return (
    <div className="max-w-[720px] mx-auto px-4 py-12">
      <h1 className="font-lore text-[28px] font-bold text-txt mb-8">Privacy Policy</h1>
      <p className="text-[11px] text-txt-muted mb-8">Last updated: March 13, 2026</p>

      <div className="space-y-6 text-[13px] text-txt-secondary leading-relaxed">
        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">1. Overview</h2>
          <p>PigeonHouse (&quot;the Platform&quot;) is a decentralized protocol interface. We are committed to protecting your privacy. This policy describes how information is collected, used, and shared when you use the Platform at 941pigeon.fun.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">2. Information We Do Not Collect</h2>
          <p>The Platform does not:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Require account creation, email, or personal information</li>
            <li>Store private keys or seed phrases</li>
            <li>Track or store your trading history on our servers</li>
            <li>Use cookies for advertising or tracking purposes</li>
            <li>Sell any data to third parties</li>
          </ul>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">3. Information That May Be Collected</h2>
          <p>When you use the Platform, the following information may be processed:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Wallet address.</strong> Your public wallet address is visible when you connect your wallet. This is inherently public on the Solana blockchain.</li>
            <li><strong>On-chain transactions.</strong> All transactions are recorded on the Solana blockchain and are publicly visible. This is a feature of blockchain technology, not a choice by the Platform.</li>
            <li><strong>IP address and basic request data.</strong> Our hosting provider (Vercel) may log IP addresses and request metadata for security and rate-limiting purposes. These logs are transient and not used for tracking.</li>
            <li><strong>RPC requests.</strong> Interactions with the Solana blockchain are routed through RPC providers (e.g., Helius) who may have their own privacy policies.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">4. Third-Party Services</h2>
          <p>The Platform integrates with third-party services that have their own privacy policies:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Wallet providers</strong> (Phantom, Backpack, Solflare, etc.) — for transaction signing</li>
            <li><strong>Helius</strong> — as an RPC provider for blockchain data</li>
            <li><strong>Jupiter</strong> — for token swap routing</li>
            <li><strong>DexScreener</strong> — for price data</li>
            <li><strong>Irys/Arweave</strong> — for decentralized image storage</li>
            <li><strong>Vercel</strong> — for hosting</li>
          </ul>
          <p className="mt-2">We encourage you to review the privacy policies of these services.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">5. Blockchain Data</h2>
          <p>All transactions on PigeonHouse are executed on the Solana blockchain and are permanently, publicly recorded. This includes token creation, buy/sell transactions, burn events, and graduation events. This data cannot be deleted or modified by any party. This transparency is by design.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">6. Data Security</h2>
          <p>We implement security measures including rate limiting, security headers, and input validation. However, no system is perfectly secure. The Platform never has access to your private keys — all transactions are signed locally in your wallet.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">7. Changes</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">8. Contact</h2>
          <p>For privacy-related inquiries, reach out via <a href="https://x.com/941pigeondotfun" target="_blank" rel="noopener noreferrer" className="text-crimson underline">@941pigeondotfun</a> on X.</p>
        </section>
      </div>
    </div>
  );
}
