import { redirect } from "next/navigation";

export default function ClinicalPage() {
  // Clinical Briefing is fully merged into Appointments Start Session Studio
  redirect("/appointments?session=active");
}
