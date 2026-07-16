import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { BodyMapClient } from "@/features/body-map/components/BodyMapClient";

export default async function BodyMapPage() {
  const user = await requireCurrentUser();
  return (
    <>
      <DashboardHeader title="خريطة العضلات" showBackButton />
      <PageContainer><BodyMapClient userId={user.id} /></PageContainer>
    </>
  );
}
