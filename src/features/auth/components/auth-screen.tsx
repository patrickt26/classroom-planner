import Link from "next/link";
import { login, recover, resetPassword, signup } from "../actions";
import { AccountForm } from "./account-form";

const email = {
  name: "email",
  label: "E-mail",
  type: "email",
  autoComplete: "email",
} as const;
const newPassword = {
  name: "password",
  label: "Nova senha (mínimo de 8 caracteres)",
  type: "password",
  autoComplete: "new-password",
  minLength: 8,
} as const;
const screens = {
  login: {
    title: "Entrar",
    action: login,
    fields: [
      email,
      {
        name: "password",
        label: "Senha",
        type: "password" as const,
        autoComplete: "current-password",
      },
    ],
    submit: "Entrar",
  },
  signup: {
    title: "Criar conta",
    action: signup,
    fields: [email, newPassword],
    submit: "Criar conta",
  },
  recover: {
    title: "Recuperar senha",
    action: recover,
    fields: [email],
    submit: "Enviar link de recuperação",
  },
  reset: {
    title: "Redefinir senha",
    action: resetPassword,
    fields: [newPassword],
    submit: "Salvar nova senha",
  },
};
export function AuthScreen({
  mode,
  notice,
}: {
  mode: keyof typeof screens;
  notice?: string;
}) {
  const { title, ...form } = screens[mode];
  return (
    <>
      <h1 className="text-3xl font-bold text-brown">{title}</h1>
      {notice && <p role="alert">{notice}</p>}
      <AccountForm {...form} />
      <nav className="grid text-center text-sm font-medium underline underline-offset-4">
        {mode === "login" ? (
          <>
            <Link className="p-3.5" href="/recuperar-senha">
              Esqueci minha senha
            </Link>
            <Link className="p-3.5" href="/criar-conta">
              Criar conta
            </Link>
          </>
        ) : (
          <Link className="p-3.5" href="/entrar">
            Voltar para entrar
          </Link>
        )}
      </nav>
    </>
  );
}
