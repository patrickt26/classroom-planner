import { createHash } from "node:crypto";
import { beforeEach, expect, test, vi } from "vitest";
import { eraseStudent } from "./actions";

const { rpc, setHeader, revalidatePath } = vi.hoisted(() => ({
  rpc: vi.fn(),
  setHeader: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc }),
}));
vi.mock("@/features/workspace/queries", () => ({
  requireTeacherWorkspace: async () => ({ workspace_id: "espaço da sessão" }),
}));
vi.mock("@/features/guardians/schema", () => import("../guardians/schema"));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(path);
  },
}));
const id = "14200000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockReturnValue({ setHeader });
});

test("valida o aluno e exige o nome digitado antes da chamada", async () => {
  const form = new FormData();
  expect(await eraseStudent(id, null, form)).toMatchObject({
    variant: "error",
  });
  form.set("name", "Aluno A");
  expect(await eraseStudent("inválido", null, form)).toMatchObject({
    variant: "error",
  });
  expect(rpc).not.toHaveBeenCalled();
});

test("usa o espaço da sessão e confirma o nome exato, inclusive acentos", async () => {
  const form = new FormData();
  form.set("name", "Aluno da Exclusão");
  form.set("workspace_id", "outro espaço");
  setHeader.mockResolvedValue({ error: null });
  await expect(eraseStudent(id, null, form)).rejects.toThrow(
    "/alunos?situacao=arquivados&aviso=excluido",
  );
  expect(rpc).toHaveBeenCalledWith("erase_student_data", {
    target_workspace_id: "espaço da sessão",
    target_student_id: id,
  });
  expect(setHeader).toHaveBeenCalledWith(
    "x-student-name-sha256",
    createHash("sha256").update("Aluno da Exclusão", "utf8").digest("hex"),
  );
});

test.each(["student_name_mismatch", "archived_student_required"])(
  "exibe erro quando o banco recusa %s",
  async (message) => {
    const form = new FormData();
    form.set("name", "Aluno A");
    setHeader.mockResolvedValue({ error: { message } });
    expect(await eraseStudent(id, null, form)).toMatchObject({
      variant: "error",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  },
);
