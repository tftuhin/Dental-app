// Illustrations of DentalOS1 screens for the website (drawn in HTML, not screenshots).
// Names and numbers are made up.

import { Check, CalendarDays, Receipt, FileSignature, Pill, MessageSquare, ShieldCheck, Signal, Wifi, BatteryFull, Sparkles } from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";

export function MockWindow({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_30px_80px_-20px_rgba(15,60,60,0.35)] ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <span className="ml-3 truncate rounded-md bg-white px-2 py-0.5 text-[10px] text-slate-400 ring-1 ring-slate-200">{title}</span>
      </div>
      {children}
    </div>
  );
}

const QUEUE = [
  { s: "01", n: "Farzana Akter", r: "Pain, lower right molar", st: "With doctor", c: "bg-teal-100 text-teal-800" },
  { s: "02", n: "Imran Hossain", r: "Scaling and polishing", st: "Checked in", c: "bg-sky-100 text-sky-800" },
  { s: "03", n: "Nusrat Jahan", r: "Crown fitting, #36", st: "11:30 AM", c: "bg-slate-100 text-slate-600" },
  { s: "04", n: "Rafiq Ahmed", r: "Booked online", st: "12:00 PM", c: "bg-violet-100 text-violet-800" },
  { s: "05", n: "Sharmin Sultana", r: "Follow-up, RCT", st: "12:30 PM", c: "bg-slate-100 text-slate-600" },
];

export function QueueMock() {
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <CalendarDays className="h-4 w-4 text-teal-700" />
          Today&apos;s queue · Chair 1
        </p>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">2 waiting</span>
      </div>
      <ul className="space-y-2">
        {QUEUE.map((q, i) => (
          <li key={q.s} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${i === 0 ? "border-teal-200 bg-teal-50/60" : "border-slate-100"}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white font-mono text-xs font-bold text-teal-700 ring-1 ring-slate-200">{q.s}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-slate-900">{q.n}</span>
              <span className="block truncate text-[11px] text-slate-500">{q.r}</span>
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${q.c}`}>{q.st}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Upper arch, FDI 18 → 28; a few teeth with conditions
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const COND: Record<number, string> = { 16: "fill-red-300", 26: "fill-sky-300", 36: "fill-amber-300", 46: "fill-red-300", 21: "fill-violet-300", 38: "fill-slate-300" };

function Tooth({ n }: { n: number }) {
  const cls = COND[n] || "fill-white";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg viewBox="0 0 20 20" className="h-6 w-6 sm:h-7 sm:w-7">
        <polygon points="0,0 20,0 14,6 6,6" className={`${n === 36 ? "fill-amber-300" : "fill-white"} stroke-slate-300`} strokeWidth="0.8" />
        <polygon points="20,0 20,20 14,14 14,6" className={`${cls === "fill-white" ? "fill-white" : cls} stroke-slate-300`} strokeWidth="0.8" />
        <polygon points="20,20 0,20 6,14 14,14" className="fill-white stroke-slate-300" strokeWidth="0.8" />
        <polygon points="0,20 0,0 6,6 6,14" className={`${n === 16 || n === 46 ? "fill-red-300" : "fill-white"} stroke-slate-300`} strokeWidth="0.8" />
        <rect x="6" y="6" width="8" height="8" className={`${cls} stroke-slate-300`} strokeWidth="0.8" />
      </svg>
      <span className={`text-[8px] font-mono ${COND[n] ? "font-bold text-slate-700" : "text-slate-400"}`}>{n}</span>
    </div>
  );
}

export function OdontogramMock() {
  return (
    <div className="space-y-4 p-5">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        <ToothIcon className="h-4 w-4 text-teal-700" />
        Odontogram · Farzana Akter
      </p>
      <div className="space-y-3 overflow-hidden">
        <div className="flex justify-between gap-0.5">{UPPER.map((n) => <Tooth key={n} n={n} />)}</div>
        <div className="border-t border-dashed border-slate-200" />
        <div className="flex justify-between gap-0.5">{LOWER.map((n) => <Tooth key={n} n={n} />)}</div>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-slate-600">
        {[
          ["bg-red-300", "Caries"],
          ["bg-sky-300", "Restored"],
          ["bg-amber-300", "Planned RCT"],
          ["bg-violet-300", "Crown"],
          ["bg-slate-300", "Missing"],
        ].map(([c, l]) => (
          <span key={l} className="flex items-center gap-1">
            <span className={`h-2.5 w-2.5 rounded-sm ${c}`} />
            {l}
          </span>
        ))}
      </div>
      <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
        <b className="text-slate-800">#36</b> Deep occlusal caries, percussion positive, lingering cold response.
        <span className="mt-1 block font-semibold text-teal-800">Provisional diagnosis: symptomatic irreversible pulpitis</span>
      </div>
    </div>
  );
}

export function ConsentMock() {
  return (
    <div className="bg-slate-100/70 p-5">
      <div className="mx-auto max-w-sm rotate-[-1deg] rounded-md bg-white p-5 shadow-lg ring-1 ring-slate-200">
        <p className="text-[11px] font-bold text-teal-800">Smile Care Dental Clinic</p>
        <p className="text-[8px] text-slate-400">Dhanmondi, Dhaka · +880 17XX-XXXXXX</p>
        <div className="my-2 h-px bg-teal-700/40" />
        <p className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-800">Informed consent for oral surgery</p>
        <div className="mt-2 grid grid-cols-2 gap-x-2 rounded border border-slate-200 p-1.5 text-[8px] text-slate-600">
          <span><b>Patient:</b> Farzana Akter</span>
          <span><b>Age:</b> 34 / F</span>
          <span><b>Surgery:</b> Removal of #38</span>
          <span><b>Cost:</b> ৳6,500</span>
        </div>
        <div className="mt-2 space-y-1">
          {[92, 100, 84, 96, 70, 88, 60].map((w, i) => (
            <div key={i} className="h-1 rounded bg-slate-200" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-5">
          <div>
            <svg viewBox="0 0 100 24" className="h-6 w-full text-slate-700">
              <path d="M2 18 C 12 4, 18 22, 28 10 S 44 4, 50 14 S 66 20, 72 8 S 90 10, 98 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div className="border-t border-slate-400 pt-0.5 text-[7px] text-slate-500">Patient</div>
          </div>
          <div>
            <svg viewBox="0 0 100 24" className="h-6 w-full text-teal-800">
              <path d="M4 14 C 14 2, 20 20, 32 12 S 50 6, 58 16 S 80 4, 96 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div className="border-t border-slate-400 pt-0.5 text-[7px] text-slate-500">Doctor · BMDC 12345</div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-4 flex max-w-sm items-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] shadow-sm ring-1 ring-emerald-200">
        <FileSignature className="h-4 w-4 text-emerald-600" />
        <span className="flex-1 text-slate-700">Both signatures confirmed</span>
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">Send to surgery</span>
      </div>
    </div>
  );
}

const RX = [
  ["Tab. Amoxiclav 625 mg", "1+0+1", "5 days · after meal"],
  ["Tab. Ketorolac 10 mg", "1+1+1", "3 days · after meal"],
  ["Cap. Omeprazole 20 mg", "1+0+1", "5 days · before meal"],
  ["Chlorhexidine mouthwash", "2 times", "7 days · after brushing"],
];

export function PrescriptionMock() {
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-start justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Pill className="h-4 w-4 text-teal-700" />
          Prescription
        </p>
        <span className="font-serif text-2xl font-bold italic text-teal-800">℞</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800">
        <ShieldCheck className="h-4 w-4" />
        Allergy on file: <b>Penicillin</b>. Check amoxicillin-based medicines.
      </div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
        {RX.map(([m, d, t]) => (
          <li key={m} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold text-slate-900">{m}</span>
              <span className="text-[10px] text-slate-500">{t}</span>
            </span>
            <span className="shrink-0 rounded-md bg-teal-50 px-2 py-0.5 font-mono text-[11px] font-bold text-teal-800">{d}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-500">
        Follow-up booked: <b className="text-slate-800">Sun, 22 Nov · 10:30 AM</b> · Serial #04
      </p>
    </div>
  );
}

export function BillMock() {
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Receipt className="h-4 w-4 text-teal-700" />
          Invoice INV-20261108-001
        </p>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Part paid</span>
      </div>
      <table className="w-full text-[12px]">
        <tbody className="divide-y divide-slate-100">
          {[
            ["Root canal treatment, molar #36", "8,500"],
            ["Periapical X-ray", "300"],
            ["Local anaesthetic cartridge × 2", "300"],
          ].map(([d, a]) => (
            <tr key={d}>
              <td className="py-1.5 text-slate-600">{d}</td>
              <td className="py-1.5 text-right font-medium text-slate-900">৳{a}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-[12px]">
        <div className="flex justify-between"><span className="text-slate-500">Total</span><b>৳9,100</b></div>
        <div className="flex justify-between"><span className="text-slate-500">Paid by bKash · TrxID 9BX4K2L7QP</span><b className="text-emerald-700">৳5,000</b></div>
        <div className="flex justify-between border-t border-slate-200 pt-1"><span className="font-semibold">Due</span><b className="text-amber-700">৳4,100</b></div>
      </div>
      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-semibold">
        {["Cash", "bKash", "Nagad", "Card"].map((m) => (
          <span key={m} className={`rounded-lg py-1.5 ${m === "bKash" ? "bg-pink-600 text-white" : "bg-slate-100 text-slate-600"}`}>{m}</span>
        ))}
      </div>
    </div>
  );
}

export function PhoneMock() {
  return (
    <div className="flex justify-center bg-gradient-to-b from-slate-50 to-white p-5">
      <div className="w-56 rounded-[2rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl">
        <div className="overflow-hidden rounded-[1.5rem] bg-[#ece5dd]">
          <div className="flex items-center justify-between bg-white px-4 pt-2 text-[9px] text-slate-700">
            <span>10:42</span>
            <span className="flex items-center gap-1">
              <Signal className="h-2.5 w-2.5" />
              <Wifi className="h-2.5 w-2.5" />
              <BatteryFull className="h-3 w-3" />
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 pb-2 pt-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-white">
              <ToothIcon className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[11px] font-semibold text-slate-900">Smile Care Dental</span>
              <span className="text-[9px] text-slate-500">SMS</span>
            </span>
          </div>
          <div className="space-y-2 px-3 py-4">
            <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white px-2.5 py-1.5 text-[10px] leading-snug text-slate-800 shadow-sm">
              প্রিয় নুসরাত, ডা. সারা আপনাকে ১৫ ডিসেম্বরের মধ্যে ক্রাউন ফিটিং করানোর পরামর্শ দিয়েছিলেন। সময় নিতে কল করুন।
              <span className="mt-0.5 block text-right text-[8px] text-slate-400">10:30</span>
            </div>
            <div className="ml-auto max-w-[75%] rounded-xl rounded-tr-sm bg-[#dcf8c6] px-2.5 py-1.5 text-[10px] leading-snug text-slate-800 shadow-sm">
              Sunday 11am possible?
              <span className="mt-0.5 block text-right text-[8px] text-slate-400">10:41 ✓✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReminderApprovalCard({ className = "" }: { className?: string }) {
  return (
    <div className={`w-64 rounded-2xl bg-white p-3.5 shadow-xl ring-1 ring-slate-200 ${className}`}>
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
        <MessageSquare className="h-3.5 w-3.5" />
        Reminder to approve
      </p>
      <p className="mt-1 text-[12px] font-semibold text-slate-900">Nusrat Jahan · crown fitting</p>
      <p className="text-[11px] text-slate-500">Planned for 15 Dec, not booked yet</p>
      <div className="mt-2 flex gap-1.5">
        <span className="flex-1 rounded-lg bg-slate-100 py-1 text-center text-[10px] font-semibold text-slate-600">Edit</span>
        <span className="flex-1 rounded-lg bg-teal-700 py-1 text-center text-[10px] font-semibold text-white">Approve & send</span>
      </div>
    </div>
  );
}

export function PaidCard({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-56 items-center gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <Check className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[12px] font-semibold text-slate-900">৳5,000 received</span>
        <span className="text-[10px] text-slate-500">bKash · receipt printed ×2</span>
      </span>
    </div>
  );
}

/** Small bar chart for the collections card. */
export function CollectionsMini() {
  const bars = [42, 65, 38, 80, 56, 92, 70];
  return (
    <div className="flex h-24 items-end gap-1.5">
      {bars.map((h, i) => (
        <span key={i} className={`flex-1 rounded-t-md ${i === 5 ? "bg-teal-600" : "bg-teal-200"}`} style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

// ─── AI ─────────────────────────────────────────────────────

/** The Clinical Copilot panel: the doctor's notes in, structured suggestions out. */
export function CopilotMock() {
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Clinical Copilot
        </p>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Suggestions · doctor decides</span>
      </div>
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {["#36", "Throbbing pain, worse at night", "Cold: lingering", "Percussion +", "Allergy: penicillin"].map((t) => (
          <span key={t} className={`rounded-full px-2 py-0.5 font-medium ${t.startsWith("Allergy") ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"}`}>
            {t}
          </span>
        ))}
      </div>
      <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-[11px] leading-snug">
        <div>
          <p className="font-bold uppercase tracking-wide text-teal-800">1 · Differential diagnoses</p>
          <p className="mt-1 text-slate-800">
            <b>Symptomatic irreversible pulpitis</b> <span className="font-mono text-slate-500">K04.0</span>
          </p>
          <p className="text-slate-500">Lingering cold response and nocturnal pain point to pulpal involvement.</p>
          <p className="mt-1 text-slate-800">
            <b>Acute apical periodontitis</b> <span className="font-mono text-slate-500">K04.4</span>
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-teal-800">2 · Tests</p>
          <p className="text-slate-700">Periapical X-ray of #36 · pulp vitality test of #35 and #37</p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-teal-800">3 · Procedures</p>
          <p className="text-slate-700">
            <span className="font-mono">D3330</span> Root canal, molar
          </p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wide text-teal-800">4 · Medicines</p>
          <p className="text-slate-700">Azithromycin 500 mg, 1+0+0 · 3 days</p>
          <p className="font-semibold text-emerald-700">✓ Allergy check: avoids penicillins</p>
        </div>
      </div>
      <div className="flex gap-2">
        <span className="flex-1 rounded-lg bg-slate-900 py-1.5 text-center text-[11px] font-semibold text-white">Add to notes</span>
        <span className="flex-1 rounded-lg bg-slate-100 py-1.5 text-center text-[11px] font-semibold text-slate-600">Ask again</span>
      </div>
    </div>
  );
}

/** The prescription drafted from the visit, with the AI's reasoning, before the doctor signs. */
export function RxDraftMock() {
  return (
    <div className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Pill className="h-4 w-4 text-teal-700" />
          Prescription · Farzana Akter
        </p>
        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-[10px] font-semibold text-white">
          <Sparkles className="h-3 w-3" />
          Drafted from today&apos;s visit
        </span>
      </div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
        {[
          ["Tab. Azin 500 mg", "Azithromycin", "1+0+0", "3 days"],
          ["Tab. Napa Extend 665 mg", "Paracetamol", "1+0+1", "3 days"],
          ["Oralon 0.2% mouthwash", "Chlorhexidine", "2 times", "7 days"],
        ].map(([b, g, d, t]) => (
          <li key={b} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="min-w-0">
              <span className="block truncate text-[12px] font-semibold text-slate-900">{b}</span>
              <span className="text-[10px] text-slate-500">
                {g} · {t}
              </span>
            </span>
            <span className="shrink-0 rounded-md bg-teal-50 px-2 py-0.5 font-mono text-[11px] font-bold text-teal-800">{d}</span>
          </li>
        ))}
      </ul>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-snug text-amber-950">
        <p className="flex items-center gap-1.5 font-bold">
          <Sparkles className="h-3.5 w-3.5" />
          Why this draft
        </p>
        <p className="mt-1">
          Penicillin allergy on file, so azithromycin instead of amoxicillin. Paracetamol rather than an NSAID because of the patient&apos;s
          asthma. Review before signing.
        </p>
      </div>
      <div className="flex gap-2">
        <span className="flex-1 rounded-lg bg-slate-100 py-1.5 text-center text-[11px] font-semibold text-slate-600">Edit</span>
        <span className="flex-1 rounded-lg bg-teal-700 py-1.5 text-center text-[11px] font-semibold text-white">Sign prescription</span>
      </div>
    </div>
  );
}

/** Small floating card: the AI has drafted the prescription. */
export function AiDraftCard({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-60 items-center gap-3 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-slate-200 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950">
        <Sparkles className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-[12px] font-semibold text-slate-900">Prescription drafted by AI</span>
        <span className="text-[10px] text-slate-500">Allergy-checked · ready for the doctor</span>
      </span>
    </div>
  );
}
