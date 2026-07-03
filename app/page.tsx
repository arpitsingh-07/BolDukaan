import { VoiceOnboarding } from "@/components/VoiceOnboarding";
import { AccountNav } from "@/components/AccountNav";

export default function Home() {
  return <VoiceOnboarding nav={<AccountNav />} />;
}
