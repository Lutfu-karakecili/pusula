import { getCurrentProfile } from "@/lib/get-current-profile";
import { SeminarAdmin } from "./seminar-admin";

export default async function SeminarsPage() {
  await getCurrentProfile();
  return <SeminarAdmin />;
}
