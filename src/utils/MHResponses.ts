import { DEFAULT_COMPLETE_RESPONSE, ICompleteResponse, ErrorType, ErrorMessages} from "../types";
import { mergeDeep } from "./miscUtils";

export class MHError extends Error {
  completeResponse: ICompleteResponse;

  constructor(originalError: Error, partialResponse: Partial<ICompleteResponse>, code: ErrorType) {
    mergeDeep(partialResponse, { responseCode: code, responseMsg: ErrorMessages[code] });
    const completeResponse = generateCompleteResponse(partialResponse);
    super(originalError.message);
    this.name = originalError.name;
    this.completeResponse = completeResponse;
    this.stack = originalError.stack; // Preserving the original stack trace
  }
}

export function generateCompleteResponse(partialResponse: Partial<ICompleteResponse>): ICompleteResponse {
  const completeResponse: ICompleteResponse = mergeDeep<ICompleteResponse>({}, {...DEFAULT_COMPLETE_RESPONSE, ...partialResponse});
  return completeResponse;
}
