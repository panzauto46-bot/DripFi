export function normalizeDripfiError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong.";

  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("getstrategyidsbyowner") &&
    lowerMessage.includes("out of bounds")
  ) {
    return "Strategy sync was reading from the wrong RPC. Refresh the page and keep the wallet on the DripFi appchain.";
  }

  if (
    lowerMessage.includes("does not exist on chain") ||
    lowerMessage.includes("trying to query sequence") ||
    lowerMessage.includes("account sequence")
  ) {
    return "This Initia account is not active on DripFi yet. Bridge or send a small amount of INIT first, then try again.";
  }

  if (lowerMessage.includes("failed to fetch")) {
    return "The DripFi RPC endpoint is unreachable right now. Try again in a moment.";
  }

  return message;
}
