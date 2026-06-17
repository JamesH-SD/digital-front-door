import LegalPageShell, { LegalSection } from "@/components/legal/LegalPageShell";

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" updatedAt="June 2026">
      <LegalSection title="Information We Collect">
        <p>
          We may collect account information, business information, customer
          lead details, uploaded content, chat messages, appointment details,
          usage information, technical logs, and billing-related data.
        </p>
      </LegalSection>

      <LegalSection title="How We Use Information">
        <p>
          We use information to provide Contactor, operate AI receptionist
          features, manage accounts, capture leads, support scheduling,
          process billing, improve the product, prevent abuse, and communicate
          with users.
        </p>
      </LegalSection>

      <LegalSection title="Business Customer Data">
        <p>
          Businesses using Contactor may collect customer names, phone numbers,
          emails, project details, service requests, appointment details, and
          uploaded files or images.
        </p>
        <p>
          Businesses are responsible for how they use customer information
          collected through their Contactor workspace or website.
        </p>
      </LegalSection>

      <LegalSection title="AI Processing">
        <p>
          Information provided to Contactor may be processed by AI systems to
          generate responses, summarize leads, assist with workflows, suggest
          content, and support customer interactions.
        </p>
        <p>
          Customer and business data is not sold. If AI processing practices
          change, this policy will be updated.
        </p>
      </LegalSection>

      <LegalSection title="Third-Party Providers">
        <p>
          We may use third-party providers for hosting, authentication, AI
          services, email delivery, SMS, calendar integrations, analytics,
          payment processing, storage, and security.
        </p>
        <p>
          Examples may include Supabase, OpenAI, Stripe, Google, Twilio,
          Resend, Vercel, or similar providers.
        </p>
      </LegalSection>

      <LegalSection title="Payments">
        <p>
          Payment information may be processed by third-party payment providers
          such as Stripe. Contactor does not need to store full credit card
          numbers directly.
        </p>
      </LegalSection>

      <LegalSection title="Cookies and Analytics">
        <p>
          We may use cookies, logs, and similar technologies to keep the service
          working, understand usage, improve performance, and secure accounts.
        </p>
      </LegalSection>

      <LegalSection title="Data Security">
        <p>
          We use reasonable technical and organizational safeguards to protect
          information, but no system can be guaranteed completely secure.
        </p>
      </LegalSection>

      <LegalSection title="Data Retention">
        <p>
          We retain information as needed to provide the service, comply with
          legal obligations, resolve disputes, prevent abuse, and improve
          operations.
        </p>
      </LegalSection>

      <LegalSection title="Your Choices">
        <p>
          You may request updates, access, or deletion of certain information by
          contacting us. Some information may be retained for legal, billing,
          security, or operational reasons.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Contactor is intended for business use and is not directed to
          children.
        </p>
      </LegalSection>

      <LegalSection title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Continued use of
          Contactor after updates means you accept the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions can be sent to support@getcontactor.com.</p>
      </LegalSection>
    </LegalPageShell>
  );
}