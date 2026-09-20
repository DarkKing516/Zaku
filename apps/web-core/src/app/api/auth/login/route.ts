import { MakeApiRequest, MakeApiResponse } from "@/utils/api-request";
import { Post } from "@/utils/https-request";
import { NextRequest, NextResponse } from "next/server";
import { UpdateSession, DestroySession } from "@/utils/session";

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const requestData = MakeApiRequest(body);

    const response = await Post<any>({
      module: "Core",
      controller: "auth",
      action: "Login",
      data: requestData,
    });

    if (response.success && response.success.data) {
      // Limpiar sesión anterior
      await DestroySession();

      const rawData = response.success.data;

      await UpdateSession({
        user: {
          accessToken: rawData.accessToken,
          user: {
            id: rawData.user?.id,
            email: rawData.user?.email || requestData.email,
            tenantId: rawData.user?.tenantId,
          },
        },
      });

      return new NextResponse(MakeApiResponse(response.success), { status: 200 });
    }

    // Si el backend devuelve directamente { accessToken } sin wrapper .data
    if (response.success && response.success.accessToken) {
      await DestroySession();

      await UpdateSession({
        user: {
          accessToken: response.success.accessToken,
          user: {
            email: requestData.email,
          },
        },
      });

      return new NextResponse(MakeApiResponse(response.success), { status: 200 });
    }

    if (response.error) {
      return new NextResponse(MakeApiResponse(response.error), { status: response.error.code || 400 });
    }

    return new NextResponse(MakeApiResponse({ message: "Respuesta inesperada del servidor" }), { status: 500 });
  } catch (error: any) {
    return new NextResponse(MakeApiResponse({ message: error.message }), { status: 500 });
  }
}
