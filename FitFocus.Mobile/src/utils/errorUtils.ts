type ExtractErrorMessageOptions = {
  apiBaseUrl?: string;
  offlineHint?: string;
};

export function extractErrorMessage(
  error: any,
  fallback: string,
  options: ExtractErrorMessageOptions = {}
): string {
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    if (options.offlineHint) {
      return options.offlineHint;
    }

    return options.apiBaseUrl
      ? `Cannot reach server at ${options.apiBaseUrl}. Make sure the API is running and reachable from this device.`
      : "Cannot reach server. Make sure the API is running and reachable from this device.";
  }

  if (typeof error?.response?.data === "string") {
    return error.response.data;
  }

  const validationErrors = error?.response?.data?.errors;
  if (validationErrors && typeof validationErrors === "object") {
    const firstMessage = Object.values(validationErrors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .find((value): value is string => typeof value === "string" && value.trim().length > 0);

    if (firstMessage) {
      return firstMessage;
    }
  }

  return (
    error?.response?.data?.detail ??
    error?.response?.data?.title ??
    error?.response?.data?.message ??
    fallback
  );
}
