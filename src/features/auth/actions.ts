"use server";

import { redirect } from "next/navigation";
import type { FormFeedback } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";
import { captchaError } from "./captcha";
import {
  captchaTokenSchema,
  emailSchema,
  loginSchema,
  passwordRequirements,
  passwordSchema,
  signupSchema,
} from "./schema";
import { signupEnabled } from "./signup-enabled";

function captchaOptions(form: FormData) {
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return {};
  const token = captchaTokenSchema.safeParse(form.get("captchaToken"));
  return token.success ? { captchaToken: token.data } : null;
}

function confirmationUrl() {
  const development = process.env.NODE_ENV === "development";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (development ? "http://localhost:3000" : undefined);
  if (!siteUrl) throw new Error("Configure NEXT_PUBLIC_SITE_URL.");

  let url: URL;
  try {
    url = new URL(siteUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL deve ser uma URL absoluta válida.");
  }

  if (url.protocol !== "https:" && !(development && url.protocol === "http:")) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL deve usar HTTPS fora do desenvolvimento.",
    );
  }
  return new URL("/confirmar", url.origin).href;
}

export async function login(
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  const input = loginSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return {
      variant: "error",
      message: "Informe um e-mail válido e sua senha.",
    };
  const captcha = captchaOptions(form);
  if (!captcha) return captchaError;
  const client = await createClient();
  const { error } = await client.auth.signInWithPassword({
    ...input.data,
    ...(captcha.captchaToken ? { options: captcha } : {}),
  });
  if (error?.code === "captcha_failed") return captchaError;
  if (error)
    return {
      variant: "error",
      message: "Confira o e-mail, a senha e a confirmação do cadastro.",
    };
  redirect("/");
}

export async function signup(
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  if (!signupEnabled)
    return {
      variant: "info",
      message: "O cadastro está disponível por convite.",
    };
  const input = signupSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return {
      variant: "error",
      message: `Informe um e-mail válido e uma senha de ${passwordRequirements}.`,
    };
  const captcha = captchaOptions(form);
  if (!captcha) return captchaError;
  const emailRedirectTo = confirmationUrl();
  const client = await createClient();
  const { data, error } = await client.auth.signUp({
    ...input.data,
    options: { emailRedirectTo, ...captcha },
  });
  if (error?.code === "captcha_failed") return captchaError;
  if (error)
    return {
      variant: "error",
      message: "Não foi possível criar a conta. Tente novamente.",
    };
  if (data.session) redirect("/");
  return {
    variant: "info",
    message: "Confira seu e-mail para confirmar o cadastro.",
  };
}

export async function recover(
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success)
    return { variant: "error", message: "Informe um e-mail válido." };
  const captcha = captchaOptions(form);
  if (!captcha) return captchaError;
  const redirectTo = confirmationUrl();
  const client = await createClient();
  const { error } = await client.auth.resetPasswordForEmail(email.data, {
    redirectTo,
    ...captcha,
  });
  if (error?.code === "captcha_failed") return captchaError;
  if (error)
    return {
      variant: "error",
      message:
        "Não foi possível solicitar a recuperação agora. Tente novamente.",
    };
  return {
    variant: "info",
    message:
      "Se houver uma conta com esse e-mail, você receberá o link para redefinir a senha.",
  };
}

export async function resetPassword(
  _: FormFeedback,
  form: FormData,
): Promise<FormFeedback> {
  const password = passwordSchema.safeParse(form.get("password"));
  if (!password.success)
    return {
      variant: "error",
      message: `Use uma senha de ${passwordRequirements}.`,
    };
  const client = await createClient();
  const { error } = await client.auth.updateUser({ password: password.data });
  if (error)
    return {
      variant: "error",
      message:
        "Não foi possível salvar a senha. Use uma senha diferente ou solicite outro link.",
    };
  redirect("/aceitar-termos");
}

export async function logout() {
  const client = await createClient();
  const { error } = await client.auth.signOut({ scope: "local" });
  if (error) throw new Error("Não foi possível sair. Tente novamente.");
  redirect("/entrar");
}
