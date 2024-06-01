export default class TestClass {
    private timeouts: NodeJS.Timeout[] = [];
    private activeIterations: Set<number> = new Set();

    callTestFunction() {
        for (let i = 0; i < 3; i++) {
            this.test(i + 1);
        }
    }

    private test(iteration: number) {
        // Cancel any previous timeouts
        this.timeouts.forEach(clearTimeout);
        this.timeouts = [];

        // Mark the current iteration as active
        this.activeIterations.add(iteration);

        // Start the recursive test
        this.recursiveTest(iteration, 0);
    }

    private recursiveTest(iteration: number, currentCount: number) {
        if (!this.activeIterations.has(iteration)) {
            return; // Stop if this iteration has been canceled
        }

        console.log(`Test! Iteration ${iteration}, CurrentCount ${currentCount}`);

        if (currentCount < 5) {
            const timeout = setTimeout(() => {
                this.recursiveTest(iteration, currentCount + 1);
            }, 2000);
            this.timeouts.push(timeout);
        } else {
            this.calledWhenDone().then(() => {
                console.log(`Result of iteration ${iteration}: done!`);
            });
        }
    }

    private async calledWhenDone(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("calledWhenDone finished!");
                resolve();
            }, 2000);
        });
    }
}