import { runSync } from "@/lib/sync";

export const maxDuration = 60; // só tem efeito em planos que permitem >10s

export async function POST() {
  try {
    const result = await runSync();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}