import { z } from "zod";
import { assertAdminApi, authErrorResponse } from "@/lib/auth-api";
import { submitRender } from "@/lib/render/provider";

const schema = z.object({ title: z.string().min(2).max(60), subtitle: z.string().max(80), episode: z.string().max(20), imageUrl: z.string(), imageId: z.string().optional(), template: z.enum(["bold", "documentary", "clean"]), accent: z.string(), duration: z.number().min(3).max(12) });

export async function POST(request: Request) {
  try {
    const admin = await assertAdminApi();
    return Response.json(await submitRender(admin.id, schema.parse(await request.json())));
  } catch (error) { return authErrorResponse(error); }
}
