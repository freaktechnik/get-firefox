const METHODS = [
    "getFileURL",
    "getFileName",
    "getChecksums"
];

module.exports = (t, Constructor, spec = {}) => {
    t.true("name" in Constructor);
    t.is(typeof Constructor.name, "string");

    const container = new Constructor(spec);

    for(const m of METHODS) {
        t.true(m in container);
        t.is(typeof container[m], "function");
        const promise = container[m]();
        promise.catch(() => "Just an error");
        t.is(typeof promise.then, "function", "Method returns a promise");
    }
};
