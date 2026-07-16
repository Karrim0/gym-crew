import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { ProfileSettingsClient } from "@/features/profile/components/ProfileSettingsClient";

export default async function ProfileSettingsPage() {
  const user = await requireCurrentUser();
  return (
    <>
      <DashboardHeader title="إعدادات الحساب" showBackButton />
      <PageContainer className="pb-8"><ProfileSettingsClient userId={user.id} /></PageContainer>
    </>
  );
}
