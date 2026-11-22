import { permanentRedirect } from "next/navigation";

export default function LegacyMorePage() {
  permanentRedirect("/configuracoes");
}
