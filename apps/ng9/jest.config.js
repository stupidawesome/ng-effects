module.exports = {
    name: "ng9",
    preset: "../../jest.config.js",
    coverageDirectory: "../../coverage/apps/ng9",
    snapshotSerializers: [
        "jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js",
        "jest-preset-angular/build/AngularSnapshotSerializer.js",
        "jest-preset-angular/build/HTMLCommentSerializer.js",
    ],
}
