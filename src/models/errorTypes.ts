export class CommandCancelledError extends Error {
  constructor(message = "command cancelled") {
      super(message);
      this.name = "CommandCancelledError";
  }
}

export class MaxCommandRetryError extends Error {
  constructor(maxRetries: number, message = `Command failed after max retries ${maxRetries} `) {
    // message.concat(command)
    super(message);
    this.name = "CommandCancelledError";
  }
}

export class MaxWaitTimeError extends Error {
  constructor(message = `Max wait time exceeded`) {
    // message.concat(command)
    super(message);
    this.name = "MaxWaitTimeError";
  }
}