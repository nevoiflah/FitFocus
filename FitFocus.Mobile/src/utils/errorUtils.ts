export function extractErrorMessage(error: any, fallback: string): string {
  if (typeof error?.response?.data === "string") {
    return error.response.data;
  }
  return error?.response?.data?.title ?? error?.response?.data?.message ?? fallback;
}
