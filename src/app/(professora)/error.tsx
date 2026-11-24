"use client";

import { ErrorMessage } from "../error-message";

export default function TeacherError({ retry }: { retry: () => void }) {
  return <ErrorMessage retry={retry} />;
}
