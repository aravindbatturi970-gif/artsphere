import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";

interface NotFoundPageProps {
  /** Custom explanation, e.g. for a missing artwork id. */
  message?: string;
}

export function NotFoundPage({ message }: NotFoundPageProps) {
  return (
    <div className="pt-32 pb-28 md:pt-44 md:pb-40">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <p className="eyebrow mb-4">404</p>
          <h1 className="display-title text-balance text-4xl sm:text-5xl">
            This canvas is blank
          </h1>
          <p className="mt-4 text-balance leading-relaxed text-ink-600">
            {message ??
              "The page you're looking for doesn't exist — but the collection is waiting."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/">Back to home</ButtonLink>
            <ButtonLink to="/discover" variant="secondary">
              Discover artwork
            </ButtonLink>
          </div>
        </div>
      </Container>
    </div>
  );
}
