import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AnalyticsPageContent } from "@/components/AnalyticsPageContent";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return <AnalyticsPageContent />;
}
