import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/components/landing-page";
import { TeacherLayout } from "@/features/navigation/components/teacher-layout";
import { TodayPage } from "@/features/today/components/today-page";
import { platformName } from "@/lib/platform";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  if (await getAuthenticatedUserId()) {
    return { title: `Hoje | ${platformName}` };
  }

  const title = `${platformName} | Organização de aulas particulares`;
  const description =
    "Organize alunos, agenda, planejamento e cobranças de aulas particulares em um só lugar. Peça um convite para participar da fase piloto.";
  return {
    title,
    description,
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: "/",
      type: "website",
      locale: "pt_BR",
    },
  };
}

export default async function Page() {
  if (!(await getAuthenticatedUserId())) return <LandingPage />;

  return (
    <TeacherLayout>
      <TodayPage />
    </TeacherLayout>
  );
}
