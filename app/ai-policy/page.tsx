import LegalPageShell, { LegalSection } from "@/components/legal/LegalPageShell";

export default function AiPolicyPage() {
  return (
    <LegalPageShell title="AI Policy" updatedAt="June 2026">
      <LegalSection title="Use of AI">
        <p>
          Contactor uses AI to help answer questions, capture leads, summarize
          conversations, suggest responses, create business content, and guide
          customers to next steps.
        </p>
      </LegalSection>

      <LegalSection title="AI Limitations">
        <p>
          AI may produce incomplete, outdated, or incorrect responses. AI should
          be treated as an assistant, not a replacement for human judgment.
        </p>
      </LegalSection>

      <LegalSection title="Business Responsibility">
        <p>
          Each business is responsible for the accuracy of its services,
          pricing, policies, availability, licenses, insurance, warranties,
          scheduling rules, and other business information.
        </p>
      </LegalSection>

      <LegalSection title="Human Review">
        <p>
          Businesses should review important leads, customer requests,
          appointment details, AI-generated responses, website content, and
          knowledge base information.
        </p>
      </LegalSection>

      <LegalSection title="Knowledge Base">
        <p>
          The quality of AI responses depends heavily on the information a
          business provides. Businesses should keep FAQs, services, pricing,
          policies, service areas, and uploaded documents accurate and current.
        </p>
      </LegalSection>

      <LegalSection title="No Professional Advice">
        <p>
          Contactor does not provide legal, medical, financial, engineering,
          tax, or other regulated professional advice.
        </p>
      </LegalSection>

      <LegalSection title="Prohibited Uses">
        <p>
          Users may not use Contactor to generate harmful, deceptive, illegal,
          abusive, discriminatory, or misleading content.
        </p>
      </LegalSection>

      <LegalSection title="Customer Interactions">
        <p>
          AI interactions may be stored, reviewed, summarized, and used to help
          businesses manage leads and improve customer follow-up.
        </p>
      </LegalSection>

      <LegalSection title="Changes to This Policy">
        <p>
          We may update this AI Policy as Contactor's AI features evolve.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions can be sent to support@getcontactor.com.</p>
      </LegalSection>
    </LegalPageShell>
  );
}