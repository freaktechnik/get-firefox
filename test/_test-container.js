const METHODS = [
    "getFileURL",
    "getFileName",
    "getChecksums",
];

export default (t, Constructor, spec = {}) => {
    t.true("name" in Constructor);
    t.is(typeof Constructor.name, "string");

    const container = new Constructor(spec);

    for(const method of METHODS) {
        // eslint-disable-next-line unicorn/no-computed-property-existence-check
        t.true(method in container, `container ${Constructor.name} has ${method}`);
        t.is(typeof container[method], "function");
        const promise = container[method]();
        promise.catch(() => "Just an error");
        t.is(typeof promise.then, "function", "Method returns a promise");
    }
};
