import Link from "next/link";
import type { Metadata } from "next";
import { auth, signIn } from "@/auth";
import { AccountNav, authConfigured } from "@/components/AccountNav";
import { VoiceOnboarding } from "@/components/VoiceOnboarding";
import { BrandMark } from "@/components/BrandMark";
import { t } from "@/lib/i18n";
import { viewerLang } from "@/lib/server-lang";
import gate from "@/app/dashboard/dashboard.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create your shop · BolDukaan" };

/**
 * The voice builder. Owners arrive here from the dashboard ("+ create new
 * shop"). Requires sign-in when OAuth is configured, so every shop is owned
 * by an account; in local dev without OAuth env the anonymous token flow
 * still works.
 */
export default async function CreatePage() {
  const session = await auth();
  const tr = t((await viewerLang()) ?? "hi");

  if (!session?.user && authConfigured()) {
    return (
      <main className={gate.gate}>
        <div className={gate.gateInner}>
          <p className={gate.brand}>
            <BrandMark size={34} />
            BolDukaan
          </p>
          <h1 className={gate.gateTitle}>{tr.createGateTitle}</h1>
          <p className={gate.gateSub}>{tr.createGateSub}</p>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/create" });
            }}
          >
            <button type="submit" className={gate.gateBtn}>
              {tr.gateSignInGoogle}
            </button>
          </form>
          <Link href="/" className={gate.gateLink}>
            {tr.gateBack}
          </Link>
        </div>
      </main>
    );
  }

  return <VoiceOnboarding nav={<AccountNav />} />;
}
