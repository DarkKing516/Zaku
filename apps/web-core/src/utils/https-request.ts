import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiModules } from "@/utils/constants/api-endpoints";
import { GetSession } from "@/utils/session";

type Module         = (typeof apiModules)[number];
type ModuleName     = Module["name"];
type Controller     = Module["controllers"][number];
type ControllerName = Controller["name"];
type Action         = Controller["actions"][number];
type ActionName     = Action["actionName"];

/** Respuesta estándar del backend NestJS */
export interface ResponseApi<T> {
  statusCode  : number;
  message     : string;
  data?       : T | null;
  errorImage? : string;
}

/** Resultado genérico de una petición HTTP */
export interface ApiResult<T> {
  success? : T;
  error?   : { code: number; message: string; errorImage?: string };
}

export interface ErrorModel {
  code        : number;
  message?    : string;
  error?      : string;
  errorImage? : string;
}

function findActionURL(moduleName: ModuleName, controllerName: ControllerName, actionName: ActionName): string | undefined {
  const mod = apiModules.find(m => m.name === moduleName);
  if (!mod) return undefined;

  const controller = mod.controllers.find(c => c.name === controllerName);
  if (!controller) return undefined;

  const action = controller.actions.find(a => a.actionName === actionName);
  if (!action) return undefined;

  return action.actionURL;
}

function buildFullURL(moduleName: ModuleName, controllerName: ControllerName, actionName: ActionName, urlParams?: string[]): string {
  const moduleURL = apiModules.find(m => m.name === moduleName)?.url ?? "";
  const actionURL = findActionURL(moduleName, controllerName, actionName);

  if (actionURL === undefined) throw new Error("Action URL not found");

  let url = `${moduleURL}/${controllerName}`;
  if (actionURL) url += `/${actionURL}`;
  if (urlParams && urlParams.length) url += "/" + urlParams.join("/");

  return url;
}

async function MakeRequest<T, U = any>(
  module       : ModuleName,
  controller   : ControllerName,
  action       : ActionName,
  method       : "get" | "post" | "put" | "delete" | "patch",
  data?        : U,
  headers?     : Record<string, string>,
  queryParams? : Record<string, string | number | boolean>,
  urlParams?   : string[],
): Promise<ApiResult<T>> {
  const url = buildFullURL(module, controller, action, urlParams);

  const sessionToken = (await GetSession()).user?.accessToken;

  const config: AxiosRequestConfig = {
    method,
    url,
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...headers,
    },
    params: queryParams,
    data,
  };

  try {
    const response: AxiosResponse<T> = await axios(config);
    return { success: response.data };
  } catch (error: any) {
    const errorModel: ErrorModel = {
      code       : error.response?.status || 0,
      message    : error.response?.data?.message || error.message || "Error desconocido",
      errorImage : error.response?.data?.errorImage,
    };

    return {
      error: {
        code: errorModel.code || 520,
        message: errorModel.message || "Error Desconocido",
        errorImage: error.response?.data?.errorImage,
      },
    };
  }
}

interface ApiRequestParams<T = any> {
  module       : ModuleName;
  controller   : ControllerName;
  action       : ActionName;
  data?        : T;
  headers?     : Record<string, string>;
  queryParams? : Record<string, string | number | boolean>;
  urlParams?   : string[];
}

export async function Get<T, U = any>(params: ApiRequestParams<U>): Promise<ApiResult<T>> {
  return MakeRequest<T, U>(params.module, params.controller, params.action, "get", params.data, params.headers, params.queryParams, params.urlParams);
}

export async function Post<T, U = any>(params: ApiRequestParams<U>): Promise<ApiResult<T>> {
  return MakeRequest<T, U>(params.module, params.controller, params.action, "post", params.data, params.headers, params.queryParams, params.urlParams);
}

export async function Put<T, U = any>(params: ApiRequestParams<U>): Promise<ApiResult<T>> {
  return MakeRequest<T, U>(params.module, params.controller, params.action, "put", params.data, params.headers, params.queryParams, params.urlParams);
}

export async function DeleteRequest<T, U = any>(params: ApiRequestParams<U>): Promise<ApiResult<T>> {
  return MakeRequest<T, U>(params.module, params.controller, params.action, "delete", params.data, params.headers, params.queryParams, params.urlParams);
}

export async function Patch<T, U = any>(params: ApiRequestParams<U>): Promise<ApiResult<T>> {
  return MakeRequest<T, U>(params.module, params.controller, params.action, "patch", params.data, params.headers, params.queryParams, params.urlParams);
}
