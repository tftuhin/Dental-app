import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/legal";
import { COMPANY } from "@/site/config";

// Template written to match how the software works. Have it reviewed by a
// lawyer before launch; commercial terms (fees, notice periods) belong in
// each clinic's quote or agreement.

export const metadata: Metadata = {
  title: "Terms of service",
  description: `The terms for using ${COMPANY.product}.`,
};

const p = COMPANY;

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro={`These terms apply when a dental clinic uses ${p.product}, provided by ${p.legalName} ("we", "us"). By using ${p.product}, the clinic ("you") agrees to them. If you have a separate signed agreement with us, that agreement takes priority where the two differ.`}
      sections={[
        {
          heading: "The service",
          body: (
            <p>
              {p.product} is software for running a dental clinic: appointments, clinical records, consent forms, prescriptions, billing and
              patient messages. It is provided online and used through a web browser. We may improve or change features over time; we
              won&apos;t remove a core part of the service without telling you first.
            </p>
          ),
        },
        {
          heading: "Accounts",
          body: (
            <ul>
              <li>Each person who uses {p.product} needs their own account. Accounts must not be shared.</li>
              <li>You are responsible for who you give accounts to and for removing access when someone leaves.</li>
              <li>Tell us straight away if you think an account has been misused.</li>
            </ul>
          ),
        },
        {
          heading: "Your responsibilities as a clinic",
          body: (
            <ul>
              <li>You are responsible for the patient information you record and for having the right to record and use it.</li>
              <li>You decide which messages are sent to patients and must have their agreement where the law requires it.</li>
              <li>You must keep the clinic&apos;s computers and phones reasonably secure, including any phone connected for sending SMS.</li>
              <li>You must not use {p.product} for anything unlawful, or try to access another clinic&apos;s information or disrupt the service.</li>
            </ul>
          ),
        },
        {
          heading: "Clinical decisions",
          body: (
            <p>
              {p.product} is a record-keeping and administration tool. It does not replace the judgment of a qualified dentist. Suggestions
              from the AI assistant, allergy warnings, medicine defaults and consent form templates are aids only; the treating doctor is
              responsible for diagnosis, treatment, prescriptions and the wording of consent forms used with patients.
            </p>
          ),
        },
        {
          heading: "Fees",
          body: (
            <p>
              Fees are set out in the quote or agreement we give your clinic. Unless agreed otherwise, they are payable in advance for each
              billing period. If fees are unpaid after reminders, we may limit access after giving notice; your records are not deleted
              because of a late payment.
            </p>
          ),
        },
        {
          heading: "Your data",
          body: (
            <p>
              Patient records and other information your clinic enters remain yours. We handle them as described in our{" "}
              <Link href="/privacy" className="font-medium text-teal-800 underline">
                privacy policy
              </Link>
              . You can ask for a copy of your records at any time, and when you stop using {p.product}.
            </p>
          ),
        },
        {
          heading: "Availability",
          body: (
            <p>
              We work to keep {p.product} available and to fix problems quickly, but we can&apos;t promise it will never be interrupted. Planned
              maintenance will be done outside normal clinic hours where we can. The service needs an internet connection; changes made while
              the connection is down are kept on the computer and saved when it returns.
            </p>
          ),
        },
        {
          heading: "Third-party services",
          body: (
            <p>
              Some features rely on services from others, such as SMS providers, WhatsApp, or an AI provider. Their own terms apply to them, and
              we are not responsible for their availability or for charges they make to you.
            </p>
          ),
        },
        {
          heading: "Limits on liability",
          body: (
            <p>
              To the extent the law allows, we are not liable for indirect or consequential losses, such as lost income, arising from use of{" "}
              {p.product}. Our total liability for any claim is limited to the fees your clinic paid us in the twelve months before the claim.
              Nothing in these terms limits liability that cannot be limited by law.
            </p>
          ),
        },
        {
          heading: "Ending the service",
          body: (
            <p>
              You can stop using {p.product} at the end of any billing period. We may suspend or end access if these terms are seriously broken.
              In either case, we will give you a copy of your records on request before they are deleted.
            </p>
          ),
        },
        {
          heading: "Changes to these terms",
          body: <p>We may update these terms. We will tell clinics about significant changes before they take effect.</p>,
        },
        {
          heading: "Law and contact",
          body: (
            <p>
              These terms are governed by the laws of Bangladesh. Questions about them can be sent to{" "}
              <a href={`mailto:${p.email}`} className="font-medium text-teal-800 underline">
                {p.email}
              </a>{" "}
              or {p.legalName}, {p.address}.
            </p>
          ),
        },
      ]}
    />
  );
}
