import { redirect } from "next/navigation";
import { createDataDownload } from "@/features/data-export/download";
import { loadWorkspaceExport } from "@/features/data-export/queries";
import { getCurrentAcceptance } from "@/features/legal/queries";
import { requireTeacherWorkspace } from "@/features/workspace/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const workspace = await requireTeacherWorkspace();
  const acceptance = await getCurrentAcceptance();
  if (!acceptance) redirect("/aceitar-termos");

  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return Response.json(
      { message: "Entre para baixar seus dados." },
      {
        status: 401,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  try {
    return createDataDownload(
      {
        email: data.user.email ?? null,
        terms_accepted_at: acceptance.accepted_at,
      },
      await loadWorkspaceExport(client, workspace.workspace_id),
    );
  } catch {
    return Response.json(
      { message: "Não foi possível baixar seus dados. Tente novamente." },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
