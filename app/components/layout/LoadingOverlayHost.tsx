"use client";

import Loading from "@/app/components/loading";
import { useLoading } from "@/app/providers/LoadingProvider";

export default function LoadingOverlayHost() {
  const { isLoading, message } = useLoading();

  if (!isLoading) return null;

  return <Loading variant="overlay" message={message} />;
}
