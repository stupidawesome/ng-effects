module.exports = {
    testMatch: ["**/+(*.)+(spec|test).+(ts|js)?(x)"],
    transform: {
        "^.+\\.(ts|js|html)$": "ts-jest",
    },
    resolver: "@nrwl/jest/plugins/resolver",
    moduleFileExtensions: ["ts", "js", "html"],
    coverageReporters: ["html"],
    passWithNoTests: true,
    globals: {
        "ts-jest": {
            diagnostics: {
                ignoreCodes: [151001],
            },
            tsConfig: "<rootDir>/tsconfig.spec.json",
        },
    },
    setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
}
