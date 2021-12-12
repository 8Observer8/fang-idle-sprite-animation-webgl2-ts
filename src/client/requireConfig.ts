requirejs.config({
    baseUrl: "js",
    paths: {
        "gl-matrix": "https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/gl-matrix-min"
    }
});

requirejs(["main"], () => { });
