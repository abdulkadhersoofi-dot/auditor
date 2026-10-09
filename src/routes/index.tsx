import { createFileRoute } from "@tanstack/react-router";
import { DaftarApp } from "@/components/daftar/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DaftarApp />;
}
