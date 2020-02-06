module.exports = {
    name: "ng-effects",
    preset: "../../jest.config.js",
    coverageDirectory: "../../coverage/libs/ng-effects",
    snapshotSerializers: [
        "jest-preset-angular/AngularSnapshotSerializer.js",
        "jest-preset-angular/HTMLCommentSerializer.js",
    ],
}
