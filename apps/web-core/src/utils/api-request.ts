import { CryptoJs } from "@/utils/crypto";

type HttpMethod = "POST" | "GET" | "DELETE" | "PUT" | "PATCH";

/**
 * Realiza peticiones desde componentes client-side hacia los API routes internos de Next.js.
 * Encripta el body de salida y desencripta la respuesta.
 * Dispara CustomEvent('SESSION_ERROR') en caso de 401/403.
 */
export async function ApiRequest<TRequest = any, TResponse = any>(
  endpoint: string,
  method: HttpMethod,
  data?: TRequest,
): Promise<TResponse> {
  const apiUrl = `/api/${endpoint}`;
  let response: Response;

  if (data) {
    const encryptedData: string = CryptoJs.Encrypt(JSON.stringify(data));
    response = await fetch(apiUrl, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(encryptedData),
    });
  } else {
    response = await fetch(apiUrl, {
      method,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jsonEncryptResponse = await response.json();

  let decryptedData: any;
  try {
    const decryptedString = CryptoJs.Decrypt(jsonEncryptResponse);
    decryptedData = JSON.parse(decryptedString);
  } catch {
    throw new Error("No se pudo desencriptar la respuesta del servidor.");
  }

  if (!response.ok) {
    const message = decryptedData?.message ?? "Error desconocido";

    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("SESSION_ERROR", { detail: { reason: "EXPIRED", message } }));
      } else if (response.status === 403) {
        window.dispatchEvent(new CustomEvent("SESSION_ERROR", { detail: { reason: "FORBIDDEN", message } }));
      }
    }

    throw new Error(message);
  }

  return decryptedData as TResponse;
}

/**
 * Genera una respuesta de API encriptada con los datos proporcionados.
 */
export const MakeApiResponse = <TData>(data: TData) =>
  JSON.stringify(CryptoJs.Encrypt(JSON.stringify(data)));

/**
 * Desencripta un request entrante de API.
 */
export const MakeApiRequest = (data: string) =>
  JSON.parse(CryptoJs.Decrypt(data));
