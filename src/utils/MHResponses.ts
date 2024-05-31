import { DEFAULT_COMPLETE_RESPONSE, CompleteResponse, ErrorType, ErrorMessages} from "../types";
import { combineDeep, mergeDeep } from "./miscUtils";

export class MHError extends Error {
  completeResponse: CompleteResponse;

  constructor(originalError: Error, partialResponse: Partial<CompleteResponse>, code: ErrorType) {
    mergeDeep(partialResponse, { responseCode: code, responseMsg: ErrorMessages[code] });
    const completeResponse = generateCompleteResponse(partialResponse);
    super(originalError.message);
    this.name = originalError.name;
    this.completeResponse = completeResponse;
    this.stack = originalError.stack; // Preserving the original stack trace
  }
}

export function generateCompleteResponse(partialResponse: Partial<CompleteResponse>): CompleteResponse {
  const completeResponse: CompleteResponse = combineDeep<CompleteResponse>(DEFAULT_COMPLETE_RESPONSE, partialResponse);
  return completeResponse;
}
