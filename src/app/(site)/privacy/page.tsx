import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal";
import { COMPANY } from "@/site/config";

// Template written to match how the software works. Have it reviewed by a
// lawyer before launch, and update it whenever data handling changes.

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${COMPANY.legalName} handles personal information on the ${COMPANY.product} website and in the ${COMPANY.product} application.`,
};

const p = COMPANY;

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={`This policy explains what personal information ${p.legalName} ("we", "us") handles, why, and what choices you have. It covers this website and the ${p.product} application used by dental clinics.`}
      sections={[
        {
          heading: "Two kinds of information",
          body: (
            <>
              <p>
                <b>Clinic records.</b> When a clinic uses {p.product}, it records information about its patients: names, contact details,
                medical history, examinations, treatment, prescriptions, consent forms and payments. The clinic decides what to record and why.
                For this information the clinic is responsible for its use, and we process it on the clinic&apos;s behalf and on its
                instructions.
              </p>
              <p>
                <b>Our own information.</b> We are responsible for the information we collect for ourselves: details of clinic staff who have
                accounts, and details people send us through this website.
              </p>
              <p>If you are a patient and have questions about your records, please contact your clinic first. We will help the clinic answer you.</p>
            </>
          ),
        },
        {
          heading: "What we collect",
          body: (
            <ul>
              <li>Account details for clinic staff: name, email address, role, and a password stored only as a one-way hash.</li>
              <li>Clinic details: name, address, phone numbers, doctors, opening hours and settings.</li>
              <li>Clinic records entered by the clinic, as described above.</li>
              <li>
                What you send through our website forms: your name, clinic, phone number, email, city and message. We also keep a scrambled
                (hashed) form of your internet address to block spam; we don&apos;t keep the address itself.
              </li>
              <li>Online booking requests that patients send to a clinic through its booking page, which we pass to that clinic.</li>
              <li>Technical logs from our servers, such as error reports and the time of requests, used to keep the service running.</li>
            </ul>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <ul>
              <li>To run {p.product} for the clinic: storing records, showing them to the clinic&apos;s staff and keeping computers in step.</li>
              <li>To send the messages a clinic chooses to send, such as reminders by SMS or WhatsApp.</li>
              <li>To reply to enquiries sent through this website, and to arrange demos and quotes.</li>
              <li>To keep the service secure, find and fix faults, and prevent misuse.</li>
              <li>To meet legal obligations.</li>
            </ul>
          ),
        },
        {
          heading: "What we don't do",
          body: (
            <p>
              We don&apos;t sell personal information. We don&apos;t use clinic records for advertising, and we don&apos;t look at them except
              when a clinic asks us to help with a problem or when the law requires it. This website does not use advertising or tracking
              cookies.
            </p>
          ),
        },
        {
          heading: "Who else handles it",
          body: (
            <>
              <p>We use a small number of service providers to run {p.product}. They may only use the information to provide their service to us:</p>
              <ul>
                <li>Hosting and database providers, which store the application and its records.</li>
                <li>
                  SMS and messaging services, when a clinic sends messages through them. When a clinic sends WhatsApp messages or SMS from its
                  own phone, the message goes through that phone&apos;s accounts.
                </li>
                <li>
                  An AI provider, only when a clinic uses the optional AI assistant. The details of the visit being reviewed are sent to it to
                  produce suggestions. Clinics can switch the assistant off in settings.
                </li>
              </ul>
              <p>Some of these providers may store or process information outside Bangladesh.</p>
            </>
          ),
        },
        {
          heading: "Keeping it safe",
          body: (
            <p>
              Each clinic&apos;s records are kept separate from every other clinic&apos;s. Connections are encrypted, staff sign in with their
              own accounts, and signing out clears the clinic&apos;s data from that browser. No system is perfectly secure, but we work to protect
              information and will tell affected clinics without undue delay if a breach puts their records at risk.
            </p>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              Clinic records are kept for as long as the clinic uses {p.product}. When a clinic stops, we give it a copy of its records on
              request and then delete them within a reasonable period, unless the law requires us to keep them longer. Website enquiries are
              kept for as long as needed to deal with them and follow up.
            </p>
          ),
        },
        {
          heading: "Your choices and rights",
          body: (
            <p>
              You can ask us what information we hold about you, ask us to correct it, or ask us to delete it where we are not required to
              keep it. Patients should contact their clinic about their clinic records. To make a request, email{" "}
              <a href={`mailto:${p.privacyEmail}`} className="font-medium text-teal-800 underline">
                {p.privacyEmail}
              </a>
              .
            </p>
          ),
        },
        {
          heading: "Cookies",
          body: (
            <p>
              The application uses a cookie to keep staff signed in, and stores the clinic&apos;s working data in the browser while someone is
              signed in. These are needed for it to work. The public website sets no tracking cookies.
            </p>
          ),
        },
        {
          heading: "Changes to this policy",
          body: <p>We may update this policy. The date at the top shows when it last changed. Significant changes will be told to clinics in advance.</p>,
        },
        {
          heading: "Contact",
          body: (
            <p>
              {p.legalName}, {p.address}. Email{" "}
              <a href={`mailto:${p.privacyEmail}`} className="font-medium text-teal-800 underline">
                {p.privacyEmail}
              </a>{" "}
              or call {p.phone}.
            </p>
          ),
        },
      ]}
    />
  );
}
