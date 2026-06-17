import LegalPageShell, { LegalSection } from "@/components/legal/LegalPageShell";

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms and Conditions" updatedAt="June 2026">
      <LegalSection title="Acceptance of Terms">
        <p>
          By using Contactor, you agree to these Terms and Conditions. If you do
          not agree, you should not use the service.
        </p>
      </LegalSection>

      <LegalSection title="Description of Service">
        <p>
          Contactor provides AI receptionist, website, lead capture, scheduling,
          knowledge base, and related tools for service businesses.
        </p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>
          You are responsible for maintaining accurate account information,
          protecting your login credentials, and managing access to your
          business workspace.
        </p>
      </LegalSection>

      <LegalSection title="Subscriptions, Trials, and Billing">
        <p>
          Contactor may offer subscription-based access, free trials, and
          promotional pricing. Subscription terms, pricing, trial length, and
          billing details will be displayed before payment.
        </p>
        <p>
          Paid subscriptions may renew automatically until canceled. Customers
          are responsible for canceling before the end of any trial period if
          they do not want to be charged.
        </p>
      </LegalSection>

      <LegalSection title="Customer and Business Information">
        <p>
          You are responsible for the accuracy of your services, prices,
          availability, business description, licensing, insurance, policies,
          and other information provided through Contactor.
        </p>
      </LegalSection>

      <LegalSection title="AI Output">
        <p>
          AI responses may not always be complete or accurate. You are
          responsible for reviewing AI-generated responses, business settings,
          knowledge base content, customer replies, and customer-facing content.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable Use">
        <p>
          You agree not to misuse the service, attempt unauthorized access,
          upload harmful content, interfere with platform operations, or use
          Contactor for unlawful, deceptive, abusive, or harmful purposes.
        </p>
      </LegalSection>

      <LegalSection title="Third-Party Services">
        <p>
          Contactor may rely on third-party services for hosting,
          authentication, AI processing, email, SMS, calendar integrations,
          analytics, storage, and payment processing. Your use of those features
          may also be subject to the applicable third-party terms.
        </p>
      </LegalSection>

      <LegalSection title="Cancellation">
        <p>
          Customers may cancel their subscription according to the cancellation
          process made available in the product or billing portal. Certain
          account, billing, security, or compliance records may be retained as
          required or permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <p>
          Contactor is provided as-is and as-available. To the maximum extent
          permitted by law, we are not liable for indirect, incidental,
          consequential, special, or punitive damages.
        </p>
      </LegalSection>

      <LegalSection title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. Continued use of
          Contactor after updates means you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions can be sent to support@getcontactor.com.</p>
      </LegalSection>
    </LegalPageShell>
  );
}