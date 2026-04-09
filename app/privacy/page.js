'use client';

export default function Privacy() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-inner">
          <a href="/" className="legal-brand">ExpansionLens</a>
        </div>
      </header>
      <main className="legal-content">
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: April 1, 2026</p>

        <h2>1. Information We Collect</h2>
        <p><strong>Account Information:</strong> When you create an account, we collect your email address. We do not collect passwords — authentication is handled through secure magic link emails.</p>
        <p><strong>Payment Information:</strong> Payment is processed by Stripe. We do not store credit card numbers or sensitive payment details on our servers. Stripe's privacy policy governs how your payment information is handled.</p>
        <p><strong>Report Data:</strong> When you generate a report, we store the address you searched, the industry selected, and the analysis results so you can access your purchased reports at any time.</p>
        <p><strong>Usage Data:</strong> We may collect basic usage information such as pages visited, reports generated, and browser type to improve the Service.</p>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and deliver the reports you purchase</li>
          <li>Send transactional emails (login links, purchase confirmations)</li>
          <li>Store your purchased reports for future access</li>
          <li>Improve the Service and user experience</li>
          <li>Prevent fraud and abuse</li>
        </ul>

        <h2>3. Data Sources</h2>
        <p>Reports are generated from publicly available data including:</p>
        <ul>
          <li>U.S. Census Bureau (American Community Survey)</li>
          <li>Google Places API (business listings and reviews)</li>
          <li>Walk Score API (walkability and transit data)</li>
          <li>OpenStreetMap (geographic and point-of-interest data)</li>
        </ul>
        <p>We do not collect personal information about individuals in the areas being analyzed.</p>

        <h2>4. Data Sharing</h2>
        <p>We do not sell, rent, or trade your personal information. We share data only with:</p>
        <ul>
          <li><strong>Stripe:</strong> For payment processing</li>
          <li><strong>Resend:</strong> For transactional email delivery</li>
          <li><strong>Law enforcement:</strong> When required by law</li>
        </ul>

        <h2>5. Data Retention</h2>
        <p>Your account and purchased reports are retained indefinitely so you can access them at any time. If you request account deletion, we will remove your personal data within 30 days.</p>

        <h2>6. Security</h2>
        <p>We use industry-standard security measures including encrypted connections (HTTPS), secure session management, and secure payment processing through Stripe. However, no method of transmission over the Internet is 100% secure.</p>

        <h2>7. Cookies</h2>
        <p>We use a single HTTP-only session cookie to keep you logged in. We do not use tracking cookies or third-party advertising cookies.</p>

        <h2>8. Your Rights</h2>
        <p>Regardless of where you are located, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Export your purchased reports</li>
          <li>Withdraw any previously granted consent</li>
          <li>Lodge a complaint with a supervisory authority</li>
        </ul>
        <p>To exercise any of these rights, email <a href="mailto:privacy@expansionlens.com">privacy@expansionlens.com</a>. We respond to verified requests within thirty (30) days.</p>

        <h2>9. California Residents (CCPA / CPRA)</h2>
        <p>If you are a California resident, you have the following additional rights under the California Consumer Privacy Act and California Privacy Rights Act:</p>
        <ul>
          <li><strong>Right to know</strong> what personal information we have collected about you, the sources, the purposes, and the categories of third parties we share it with.</li>
          <li><strong>Right to delete</strong> your personal information, subject to legal exceptions.</li>
          <li><strong>Right to correct</strong> inaccurate personal information.</li>
          <li><strong>Right to opt out of sale or sharing</strong> of your personal information. ExpansionLens does not sell or share personal information as those terms are defined under California law.</li>
          <li><strong>Right to limit use of sensitive personal information.</strong> We do not collect sensitive personal information for purposes that would trigger this right.</li>
          <li><strong>Right to non-discrimination</strong> for exercising any of these rights. We will not deny service, charge different prices, or provide a different level of service because you exercised a privacy right.</li>
        </ul>
        <p>To exercise any California privacy right, email <a href="mailto:privacy@expansionlens.com">privacy@expansionlens.com</a> with the subject line "California Privacy Request." We may need to verify your identity before processing the request.</p>

        <h2>10. European Union / United Kingdom Residents (GDPR / UK GDPR)</h2>
        <p>If you are located in the European Economic Area (EEA), the United Kingdom, or Switzerland, the General Data Protection Regulation (GDPR) and UK GDPR apply to our processing of your personal data. The data controller is ExpansionLens.</p>
        <p><strong>Legal basis for processing.</strong> We process your personal data on the following bases:</p>
        <ul>
          <li><strong>Contract:</strong> to provide the reports you purchase and deliver account services you requested.</li>
          <li><strong>Legitimate interests:</strong> to prevent fraud, secure our systems, and improve the Service.</li>
          <li><strong>Consent:</strong> where you have explicitly agreed (for example, by submitting your email address to receive a login link).</li>
          <li><strong>Legal obligation:</strong> to comply with applicable laws.</li>
        </ul>
        <p><strong>Your GDPR rights.</strong> In addition to the rights in Section 8, you have the right to:</p>
        <ul>
          <li>Object to our processing of your personal data</li>
          <li>Request restriction of processing</li>
          <li>Receive your personal data in a portable, machine-readable format</li>
          <li>Lodge a complaint with your national data protection authority</li>
        </ul>
        <p><strong>International transfers.</strong> ExpansionLens is operated from the United States, and your personal data will be processed in the United States. Where required, we rely on appropriate safeguards such as Standard Contractual Clauses approved by the European Commission.</p>
        <p>To exercise any GDPR right, email <a href="mailto:privacy@expansionlens.com">privacy@expansionlens.com</a>.</p>

        <h2>11. Children's Privacy</h2>
        <p>The Service is not intended for users under 18 years of age. We do not knowingly collect information from children.</p>

        <h2>12. Changes to This Policy</h2>
        <p>We may update this Privacy Policy periodically. We will notify registered users of material changes via email.</p>

        <h2>13. Contact</h2>
        <p>For privacy-related questions or requests, contact us at <a href="mailto:privacy@expansionlens.com">privacy@expansionlens.com</a>.</p>
      </main>
    </div>
  );
}
