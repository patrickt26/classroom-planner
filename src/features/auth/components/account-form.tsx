"use client";

import { useActionState, useCallback, useRef, useState } from "react";
import { Alert, type FormFeedback } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { captchaError } from "../captcha";
import { Turnstile } from "./turnstile";

type Field = {
  name: string;
  label: string;
  defaultValue?: string;
  optional?: boolean;
} & (
  | {
      options?: undefined;
      type?: "email" | "password";
      autoComplete?: string;
      minLength?: number;
      maxLength?: number;
    }
  | { options: { value: string; label: string }[] }
);
export function AccountForm({
  action,
  captcha,
  fields,
  submit,
}: {
  action: (state: FormFeedback, data: FormData) => Promise<FormFeedback>;
  captcha?: { siteKey: string; nonce?: string };
  fields: Field[];
  submit: string;
}) {
  const token = useRef("");
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [widgetVersion, setWidgetVersion] = useState(0);
  const verifyCaptcha = useCallback((value: string) => {
    token.current = value;
    setCaptchaFailed(false);
  }, []);
  const failCaptcha = useCallback(() => {
    token.current = "";
    setCaptchaFailed(true);
  }, []);
  const [feedback, formAction, pending] = useActionState(
    captcha
      ? async (state: FormFeedback, data: FormData) => {
          const response = token.current;
          token.current = "";
          try {
            if (!response) return captchaError;
            data.set("captchaToken", response);
            return await action(state, data);
          } finally {
            token.current = "";
            setCaptchaFailed(false);
            setWidgetVersion((version) => version + 1);
          }
        }
      : action,
    null,
  );
  const error = feedback?.variant === "error" ? feedback : null;
  const status = feedback?.variant !== "error" ? feedback : null;
  return (
    <form
      action={formAction}
      className="grid gap-5"
      onSubmit={(event) => {
        if (captcha && !token.current) {
          event.preventDefault();
          setCaptchaFailed(true);
        }
      }}
    >
      {fields.map(({ label, optional, options, ...field }) => (
        <label
          htmlFor={field.name}
          key={field.name}
          className="grid gap-2 font-medium"
        >
          {label}
          {options ? (
            <Select
              key={field.defaultValue}
              id={field.name}
              {...field}
              required={!optional}
            >
              {options.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          ) : (
            <Input id={field.name} {...field} required={!optional} />
          )}
        </label>
      ))}
      {captcha && (
        <Turnstile
          key={widgetVersion}
          {...captcha}
          onVerify={verifyCaptcha}
          onError={failCaptcha}
        />
      )}
      <Button type="submit" disabled={pending}>
        {submit}
      </Button>
      <Alert
        variant="error"
        message={captchaFailed ? captchaError.message : error?.message}
      />
      <Alert variant={status?.variant ?? "info"} message={status?.message} />
    </form>
  );
}
