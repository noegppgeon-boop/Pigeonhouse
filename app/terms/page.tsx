"use client";

export default function TermsPage() {
  return (
    <div className="max-w-[720px] mx-auto px-4 py-12">
      <h1 className="font-lore text-[28px] font-bold text-txt mb-8">Terms of Use</h1>
      <p className="text-[11px] text-txt-muted mb-8">Last updated: March 13, 2026</p>

      <div className="space-y-6 text-[13px] text-txt-secondary leading-relaxed">
        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using PigeonHouse (&quot;the Protocol&quot;, &quot;the Platform&quot;) at 941pigeon.fun, you agree to be bound by these Terms of Use. If you do not agree, do not use the Platform. The Platform provides a decentralized interface for interacting with smart contracts deployed on the Solana blockchain. Your use of the Platform is entirely at your own risk.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">2. Nature of the Protocol</h2>
          <p>PigeonHouse is a decentralized protocol consisting of open-source smart contracts on Solana. The interface at 941pigeon.fun is one of potentially many frontends that can interact with these contracts. The Protocol operates autonomously on-chain — no individual or entity has the ability to reverse, modify, or censor transactions once they are confirmed on the Solana blockchain.</p>
          <p className="mt-2">The Protocol is not a broker, financial institution, exchange, creditor, custodian, or fiduciary. No party has custody of your assets at any time.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">3. No Financial Advice</h2>
          <p>Nothing on this Platform constitutes financial, investment, legal, or tax advice. All information is provided for informational purposes only. Token prices, charts, statistics, and any other data displayed on the Platform are provided &quot;as is&quot; without any guarantee of accuracy or completeness. You should consult qualified professionals before making any financial decisions.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">4. Risk Disclosure</h2>
          <p>Using the Platform and interacting with digital assets involves significant risk, including but not limited to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li><strong>Total loss of funds.</strong> The value of digital assets can go to zero. You may lose your entire investment.</li>
            <li><strong>Smart contract risk.</strong> Despite audits and verified builds, smart contracts may contain undiscovered vulnerabilities.</li>
            <li><strong>Bonding curve mechanics.</strong> Token prices on bonding curves are determined algorithmically. Early participants may have significant price advantages. Prices can drop rapidly.</li>
            <li><strong>Impermanent loss and liquidity risk.</strong> Graduated tokens migrate to automated market makers where different risks apply.</li>
            <li><strong>Blockchain risk.</strong> The Solana network may experience congestion, outages, or other disruptions.</li>
            <li><strong>Regulatory risk.</strong> The regulatory status of digital assets and DeFi protocols varies by jurisdiction and may change.</li>
            <li><strong>Third-party risk.</strong> Tokens created by third parties on the Platform are not endorsed, vetted, or guaranteed by PigeonHouse.</li>
            <li><strong>Front-running and MEV.</strong> Transactions on public blockchains are visible before confirmation and may be subject to front-running.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">5. User-Created Tokens</h2>
          <p>Any user can create tokens on PigeonHouse. The Platform does not review, endorse, or guarantee any token created through the Protocol. Token names, symbols, images, and descriptions are set by their creators and may be misleading, offensive, or infringe on intellectual property rights. The existence of a token on the Platform does not imply any association with, endorsement by, or affiliation with any third party.</p>
          <p className="mt-2">You are solely responsible for conducting your own research before interacting with any token.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">6. Burn Mechanism</h2>
          <p>The Platform includes an automatic deflationary mechanism that permanently burns PIGEON tokens on every trade. Burns are irreversible and executed by immutable smart contract logic. The burn rate (currently 1.5% of PIGEON-paired trades) is set in on-chain configuration and can only be modified by the program authority through a transparent on-chain transaction.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">7. No Warranties</h2>
          <p>The Platform is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, whether express, implied, or statutory, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, or free of harmful components.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by applicable law, in no event shall PigeonHouse, its contributors, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or digital assets, regardless of the cause of action or theory of liability, even if advised of the possibility of such damages.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">9. Prohibited Use</h2>
          <p>You agree not to use the Platform to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Violate any applicable law or regulation</li>
            <li>Create tokens that infringe on intellectual property rights</li>
            <li>Engage in market manipulation, wash trading, or fraudulent activity</li>
            <li>Attempt to exploit, hack, or disrupt the Protocol or its smart contracts</li>
            <li>Use automated systems to interact with the Platform in a manner that degrades service for other users</li>
            <li>Access the Platform from jurisdictions where such use is prohibited</li>
          </ul>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">10. Jurisdictional Restrictions</h2>
          <p>The Platform is not available to residents or citizens of the United States, or any jurisdiction where the use of decentralized protocols, digital asset trading, or token creation is prohibited or requires licensing that has not been obtained. By using the Platform, you represent and warrant that you are not located in, incorporated in, or a citizen or resident of any such restricted jurisdiction.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">11. Open Source</h2>
          <p>The Protocol&apos;s smart contracts are open source and verified through OtterSec. The source code is available at <a href="https://github.com/noegppgeon-boop/Pigeonhouse" target="_blank" rel="noopener noreferrer" className="text-crimson underline">github.com/noegppgeon-boop/Pigeonhouse</a>. Users are encouraged to review the code and verify the on-chain program independently.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">12. Modifications</h2>
          <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Platform constitutes acceptance of any modified Terms.</p>
        </section>

        <section>
          <h2 className="font-lore text-[16px] font-bold text-txt mb-2">13. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with applicable law, without regard to conflict of law principles. Any disputes arising from or relating to these Terms or the Platform shall be resolved through binding arbitration.</p>
        </section>
      </div>
    </div>
  );
}
