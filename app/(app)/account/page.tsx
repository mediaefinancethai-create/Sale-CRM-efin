import { requireProfile } from "@/lib/auth";
import { AccountSettings } from "@/components/account-settings";

export default async function AccountPage() {
  const profile = await requireProfile();
  return <AccountSettings profile={profile} />;
}
