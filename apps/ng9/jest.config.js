module.exports = {
    name: "ng9",
    preset: "../../jest.config.js",
    coverageDirectory: "../../coverage/apps/ng9",
    snapshotSerializers: [
        "jest-preset-angular/AngularSnapshotSerializer.js",
        "jest-preset-angular/HTMLCommentSerializer.js",
    ],
}
