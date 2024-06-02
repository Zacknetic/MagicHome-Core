type CancelTokenObject = {
    cancel: () => void;
    isCancelled: () => boolean;
};

class CommandCancelledError extends Error {
    constructor(message = "command cancelled") {
        super(message);
        this.name = "CommandCancelledError";
    }
}

class WaitTestFailedError extends Error {
    constructor(message = "waitTest failed") {
        super(message);
        this.name = "WaitTestFailedError";
    }
}


export class ExampleClass {
    private currentCancelToken?: CancelTokenObject;

    private createCancelToken(): CancelTokenObject {
        let cancelled = false;
        return {
            cancel: () => {
                cancelled = true;
            },
            isCancelled: () => cancelled
        };
    }

    private async waitTest(shouldSucceed: boolean, cancellationToken: CancelTokenObject): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (cancellationToken.isCancelled()) {
                    reject(new CommandCancelledError());
                } else if (shouldSucceed) {
                    resolve(true);
                } else {
                    reject(new WaitTestFailedError());
                }
            }, 2000);

            if (cancellationToken.isCancelled()) {
                clearTimeout(timeout);
                reject(new CommandCancelledError());
            }
        });
    }

    private async loopTest(totalRetries: number, retriesUntilSuccessful: number, cancellationToken: CancelTokenObject): Promise<boolean> {
        let currRetryCount = 0;
        let finallySucceeded = false;

        while (currRetryCount < totalRetries) {
            try {
                const shouldSucceed = currRetryCount === retriesUntilSuccessful;
                finallySucceeded = await this.waitTest(shouldSucceed, cancellationToken);
                break;
            } catch (error) {
                if (error instanceof CommandCancelledError) {
                    console.log("Command cancelled");
                    throw error;
                } else if (error instanceof WaitTestFailedError) {
                    currRetryCount++;
                } else {
                    throw error; // rethrow unexpected errors
                }
            }
        }

        return finallySucceeded;
    }

    private async driverTest(totalRetries: number, retriesUntilSuccessful: number): Promise<boolean> {
        if (this.currentCancelToken) {
            this.currentCancelToken.cancel();
        }
        this.currentCancelToken = this.createCancelToken();

        return this.loopTest(totalRetries, retriesUntilSuccessful, this.currentCancelToken);
    }

    private async allSettledTest(): Promise<PromiseSettledResult<boolean>[]> {
        const promiseList: Promise<boolean>[] = [];
        const retriesUntilSuccessful = 5;

        for (let i = 0; i < 10; i++) {
            promiseList.push(this.driverTest(i, retriesUntilSuccessful).catch(() => false));
        }

        const finalResult = await Promise.allSettled(promiseList);
        return finalResult;
    }

    public async mainTest(): Promise<void> {
        try {
            const results = await this.allSettledTest();
            console.log("Results:", results);
        } catch (error) {
            console.error("An error occurred:", error);
        }
    }
}

// Usage
const example = new ExampleClass();
example.mainTest();
