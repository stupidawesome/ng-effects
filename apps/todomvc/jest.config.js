module.exports = {
    name: "todomvc",
    preset: "../../jest.config.js",
    coverageDirectory: "../../coverage/apps/todomvc",
    snapshotSerializers: [
        "jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js",
        "jest-preset-angular/build/AngularSnapshotSerializer.js",
        "jest-preset-angular/build/HTMLCommentSerializer.js",
    ],
}
