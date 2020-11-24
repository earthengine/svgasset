import * as path from "path";
import * as assert from "assert";
import * as Mocha from "mocha";

import * as vscode from "vscode";
import * as extension from "../../extension";

Mocha.describe("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  Mocha.it("should pass", () => {
    console.log(vscode.window.activeTextEditor);

    const svg = path.resolve(__dirname, "../data/icon.svg");
    assert.strictEqual("icon.svg", path.basename(svg));

    assert.strictEqual("icon", path.basename(svg, ".svg"));
  });
});
