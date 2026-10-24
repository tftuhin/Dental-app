import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return (handlers as any).GET(request);
}

export async function POST(request: NextRequest) {
  return (handlers as any).POST(request);
}
