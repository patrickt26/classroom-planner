import { CircleAlert, CircleCheck, Info } from "lucide-react";

const variants = {
  success: {
    icon: CircleCheck,
    colors: "bg-success-surface text-success",
  },
  error: {
    icon: CircleAlert,
    colors: "bg-destructive-surface text-destructive",
  },
  info: {
    icon: Info,
    colors: "bg-info-surface text-navy",
  },
} as const;

export type AlertVariant = keyof typeof variants;
export type FormFeedback = { variant: AlertVariant; message: string } | null;

export function Alert({
  variant,
  message,
}: {
  variant: AlertVariant;
  message?: string;
}) {
  const { icon: Icon, colors } = variants[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={message ? undefined : "sr-only"}
    >
      {message && (
        <div
          className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${colors}`}
        >
          <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 wrap-anywhere">{message}</span>
        </div>
      )}
    </div>
  );
}
