import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getShopForOwner } from "@/lib/shops";
import { VoiceOnboarding } from "@/components/VoiceOnboarding";
import { AccountNav } from "@/components/AccountNav";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function EditShopPage({ params }: Params) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/dashboard");

  const shop = await getShopForOwner(slug, session.user.id).catch(() => null);
  if (!shop) notFound();

  return (
    <VoiceOnboarding
      nav={<AccountNav />}
      initialStorefront={shop.storefront}
      initialSlug={slug}
    />
  );
}
