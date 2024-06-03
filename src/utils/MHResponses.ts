import { CompleteResponse, ErrorType, ErrorMessages } from "../types";
import { combineDeep, mergeDeep } from "./miscUtils";

export class MHError extends Error {
  completeResponse: CompleteResponse;

  constructor(originalError: Error, partialResponse: Partial<CompleteResponse>, code: ErrorType) {
    // Generate the complete response
    mergeDeep(partialResponse, { responseCode: code, responseMsg: ErrorMessages[code] });
    const completeResponse = generateCompleteResponse(partialResponse);

    super(originalError.message || completeResponse.responseMsg);

    this.name = 'MHError'; // Name the error class

    // Capture the stack trace and preserve the original stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Append the original stack trace
    if (originalError.stack) {
      this.stack += `\nCaused by: ${originalError.stack}`;
    }

    this.completeResponse = completeResponse;
  }
}

export function generateCompleteResponse(partialResponse: Partial<CompleteResponse>): CompleteResponse {
  const completeResponse: CompleteResponse = combineDeep<CompleteResponse>(partialResponse);
  return completeResponse;
}