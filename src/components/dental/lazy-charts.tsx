"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// The tooth and gum charts are large and only shown on their own tabs,
// so they load on demand instead of with the page.
const ChartLoading = () => <Skeleton className="h-72 w-full rounded-xl" />;

export const Odontogram = dynamic(
  () => import("@/components/dental/odontogram").then((m) => m.Odontogram),
  { ssr: false, loading: ChartLoading }
);

export const PeriodontalChart = dynamic(
  () => import("@/components/dental/perio-chart").then((m) => m.PeriodontalChart),
  { ssr: false, loading: ChartLoading }
);

export const OrthoChart = dynamic(
  () => import("@/components/dental/ortho-chart").then((m) => m.OrthoChart),
  { ssr: false, loading: ChartLoading }
);

export const ProsthoChart = dynamic(
  () => import("@/components/dental/prostho-chart").then((m) => m.ProsthoChart),
  { ssr: false, loading: ChartLoading }
);
