"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/primitives";
import { Button, ButtonLink } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="max-w-xl py-24 text-center">
      <h1 className="text-h1">Something went wrong</h1>
      <p className="text-lead mt-4 text-ink-soft">
        Sorry — this page didn&apos;t load properly. Please try again, or contact us if the problem continues.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/contact/" variant="secondary">
          Contact us
        </ButtonLink>
      </div>
    </Container>
  );
}
