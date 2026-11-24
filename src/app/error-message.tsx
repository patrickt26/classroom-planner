import { Button } from "@/components/ui/button";
import { PageMessage } from "./page-message";

export function ErrorMessage({ retry }: { retry: () => void }) {
  return (
    <PageMessage
      title="Não foi possível abrir esta página"
      description="Tente carregar a página novamente."
    >
      <Button type="button" className="px-4" onClick={retry}>
        Tentar de novo
      </Button>
    </PageMessage>
  );
}
