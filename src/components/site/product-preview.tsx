import { CalendarDays, Receipt, Check } from "lucide-react";
import { ToothIcon } from "@/components/icons/dental-icons";

const QUEUE = [
  { serial: "01", name: "Farzana Akter", reason: "Pain in lower right molar", status: "With doctor", tone: "bg-teal-100 text-teal-800" },
  { serial: "02", name: "Imran Hossain", reason: "Scaling and polishing", status: "Checked in", tone: "bg-sky-100 text-sky-800" },
  { serial: "03", name: "Nusrat Jahan", reason: "Crown fitting, #36", status: "Booked 11:30", tone: "bg-slate-100 text-slate-700" },
  { serial: "04", name: "Rafiq Ahmed", reason: "Online booking", status: "Booked 12:00", tone: "bg-violet-100 text-violet-800" },
];

const STEPS = ["Notes", "Consent", "Procedure", "Prescription", "Billing"];

/** An illustration of the app (not a screenshot): today's queue, the visit steps and a bill. */
export function ProductPreview() {
  return (
    <div className="relative" aria-label="Illustration of the DentalOS1 appointments screen" role="img">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-teal-900/10">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="ml-3 truncate text-[11px] text-slate-400">app.dentalos1 · Appointments</span>
        </div>
        <div className="grid gap-0 sm:grid-cols-[1fr_200px]">
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <CalendarDays className="h-4 w-4 text-teal-700" />
                Today&apos;s queue
              </p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">2 waiting</span>
            </div>
            <ul className="space-y-2">
              {QUEUE.map((q) => (
                <li key={q.serial} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <span className="font-mono text-xs font-bold text-teal-700">#{q.serial}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-slate-900">{q.name}</span>
                    <span className="block truncate text-[11px] text-slate-500">{q.reason}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${q.tone}`}>{q.status}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-1 pt-1">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    i < 2 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : i === 2 ? "border-teal-700 bg-teal-700 text-white" : "text-slate-500"
                  }`}
                >
                  {i < 2 && <Check className="h-2.5 w-2.5" />}
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:border-l sm:border-t-0">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <ToothIcon className="h-3.5 w-3.5 text-teal-700" />
                Odontogram
              </p>
              <div className="mt-2 grid grid-cols-8 gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-3.5 rounded-sm border ${
                      i === 5 ? "border-red-300 bg-red-200" : i === 11 ? "border-sky-300 bg-sky-200" : i === 13 ? "border-amber-300 bg-amber-200" : "border-slate-200 bg-slate-50"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <Receipt className="h-3.5 w-3.5 text-teal-700" />
                Bill
              </p>
              <dl className="mt-1.5 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Root canal, molar</dt>
                  <dd className="font-medium text-slate-900">৳8,500</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Paid by bKash</dt>
                  <dd className="font-medium text-emerald-700">৳5,000</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1">
                  <dt className="font-semibold text-slate-700">Due</dt>
                  <dd className="font-bold text-amber-700">৳3,500</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden className="absolute -bottom-5 -left-4 hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg sm:block">
        <p className="text-[11px] font-semibold text-slate-500">Reminder ready for approval</p>
        <p className="text-[13px] text-slate-800">Crown fitting due for Nusrat Jahan</p>
      </div>
    </div>
  );
}
