import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { PersonalRecordsClient } from "@/features/personal-records/components/PersonalRecordsClient";

export default async function PersonalRecordsPage() {
  const user = await requireCurrentUser();
  return (
    <>
      <DashboardHeader title="أرقامك القياسية" showBackButton />
      <PageContainer className="pb-8"><PersonalRecordsClient userId={user.id} /></PageContainer>
    </>
  );
}
