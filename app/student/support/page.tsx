import { getCurrentStudent } from "@/lib/get-current-profile";
import { SupportCenter } from "@/components/shared/support-center";

export default async function StudentSupportPage() {
  const student = await getCurrentStudent();
  return <SupportCenter userId={student.id} />;
}
