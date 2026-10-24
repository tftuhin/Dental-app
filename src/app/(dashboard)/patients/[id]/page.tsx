import { PatientProfileView } from "@/components/patients/patient-profile-view";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PatientProfileView initialPatientId={id} />;
}
