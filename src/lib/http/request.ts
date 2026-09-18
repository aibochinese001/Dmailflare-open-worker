import { RequestBodyTooLargeError } from "./errors";

export async function readJsonBody<T>(request: Request, maxBytes: number): Promise<T> {
	const contentLength = Number(request.headers.get("content-length") ?? 0);
	if (contentLength > maxBytes) throw new RequestBodyTooLargeError("Request body is too large");

	const body = await request.arrayBuffer();
	if (body.byteLength > maxBytes) throw new RequestBodyTooLargeError("Request body is too large");
	if (body.byteLength === 0) return {} as T;

	return JSON.parse(new TextDecoder().decode(body)) as T;
}

export function assertRequestSize(request: Request, maxBytes: number): void {
	const contentLength = Number(request.headers.get("content-length") ?? 0);
	if (contentLength > maxBytes) throw new RequestBodyTooLargeError("Request body is too large");
}

export async function readFormDataBody(request: Request, maxBytes: number): Promise<FormData> {
	assertRequestSize(request, maxBytes);
	const body = await request.arrayBuffer();
	if (body.byteLength > maxBytes) throw new RequestBodyTooLargeError("Request body is too large");

	return new Request(request.url, {
		method: request.method,
		headers: request.headers,
		body,
	}).formData();
}
