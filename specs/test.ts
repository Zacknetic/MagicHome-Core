async function baz() {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    throw new Error("baz failed");
  }
  
  function bar() {
    return baz();
  }
  
  function nestedBar() {
    return bar().catch((err) => {
      return Promise.reject(err); // Propagate the error
    });
  }
  
  export function foo() {
    const promiseList = [
      nestedBar(), // This will reject after 2000ms
      Promise.resolve("foo succeeded"),
    ];
  
    return Promise.allSettled(promiseList).then((results) => {
        console.log(results);
    //   results.forEach((result, index) => {
    //     if (result.status === "fulfilled") {
    //       console.log(`Promise ${index + 1} succeeded:`, result.value);
    //     } else if (result.status === "rejected") {
    //       console.error(`Promise ${index + 1} failed:`, result.reason);
    //     }
    //   });
    });
  }
  