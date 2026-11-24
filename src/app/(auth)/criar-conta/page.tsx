import { notFound } from "next/navigation";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { signupEnabled } from "@/features/auth/signup-enabled";

export default function Page() {
  if (!signupEnabled) notFound();
  return <AuthScreen mode="signup" />;
}
