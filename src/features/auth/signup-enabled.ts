const setting = process.env.NEXT_PUBLIC_SIGNUP_ENABLED;
export const signupEnabled = setting
  ? setting === "true"
  : process.env.NODE_ENV !== "production";
