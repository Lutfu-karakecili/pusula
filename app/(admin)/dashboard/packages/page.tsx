import { getCurrentProfile } from "@/lib/get-current-profile";
import { PackageAdmin } from "./package-admin";

export default async function PackagesPage() {
  await getCurrentProfile();
  return <PackageAdmin />;
}
