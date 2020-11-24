import * as vscode from "vscode";
import * as xmldoc from "xmldoc";
import * as path from "path";
import * as sharp from "sharp";
import * as fs from "fs";

interface ImageItem {
  size: string;
  idiom: string;
  filename: string;
  scale: string;
}

export class PngSaver {
  private doc: any;
  private fileName: string;

  constructor(doc: any, fileName: string) {
    this.doc = doc;
    this.fileName = fileName;
  }

  public static register(subscriptions: { dispose(): any }[]) {
    subscriptions.push(
      this.registerCommand(
        "pngsaver.saveAsPNG",
        async (o: PngSaver) => await o.saveAsPNG()
      )
    );
    subscriptions.push(
      this.registerCommand(
        "pngsaver.saveiOSAsset",
        async (o: PngSaver) => await o.saveiOSAsset()
      )
    );
  }

  public async saveAsPNG() {
    try {
      let width: Number = parseInt(this.doc.attr.width);
      let height: Number = parseInt(this.doc.attr.height);
      if (width && height) {
      } else {
        const vbx = this.doc.attr.viewBox.split(/\s+|,/);
        width = vbx[2];
        height = vbx[3];
      }

      const convertedFn = this.fileName + ".png";
      const png = sharp(this.fileName).resize(width, height).png();
      await png.toFile(convertedFn);
      vscode.window.showInformationMessage(
        "Converted " + this.fileName + " to " + convertedFn
      );
    } catch (e) {
      vscode.window.showErrorMessage(e);
    }
  }

  public async saveiOSAsset() {
    const pngdir = path.dirname(this.fileName);

    vscode.window.showInformationMessage(
      "Convertion started: " + this.fileName
    );
    const targetdir = path.resolve(pngdir, "./AppIcon.appiconset");

    if (!fs.existsSync(targetdir)) {
      fs.mkdirSync(targetdir);
    }

    const contents = {
      info: { version: 1, author: "xcode" },
      images: [] as ImageItem[],
    };

    PngSaver.iOSAppIconSet.forEach(async (e) => {
      const targetFn = e.idiom + e.size + "@" + e.scale + "x";
      const png = sharp(this.fileName)
        .resize(e.size * e.scale, e.size * e.scale)
        .png();
      await png.toFile(path.resolve(targetdir, targetFn + ".png"));
      contents.images.push({
        size: e.size + "x" + e.size,
        idiom: e.idiom,
        filename: targetFn + ".png",
        scale: e.scale + "x",
      });

      var json = JSON.stringify(contents);
      fs.writeFile(path.resolve(targetdir, "Contents.json"), json, () =>
        vscode.window.showInformationMessage("All done!")
      );
    });
  }

  private static readonly iOSAppIconSet = [
    { size: 20, idiom: "iphone", scale: 2 },
    { size: 20, idiom: "iphone", scale: 3 },
    { size: 29, idiom: "iphone", scale: 2 },
    { size: 29, idiom: "iphone", scale: 3 },
    { size: 40, idiom: "iphone", scale: 2 },
    { size: 40, idiom: "iphone", scale: 3 },
    { size: 60, idiom: "iphone", scale: 2 },
    { size: 60, idiom: "iphone", scale: 3 },
    { size: 20, idiom: "ipad", scale: 1 },
    { size: 20, idiom: "ipad", scale: 2 },
    { size: 29, idiom: "ipad", scale: 1 },
    { size: 29, idiom: "ipad", scale: 2 },
    { size: 40, idiom: "ipad", scale: 1 },
    { size: 40, idiom: "ipad", scale: 2 },
    { size: 76, idiom: "ipad", scale: 1 },
    { size: 76, idiom: "ipad", scale: 2 },
    { size: 83.5, idiom: "ipad", scale: 2 },
    { size: 1024, idiom: "ios-marketing", scale: 1 },
  ];

  private static registerCommand(
    cmd: string,
    fn: (p: PngSaver) => void
  ): vscode.Disposable {
    const disposable = vscode.commands.registerCommand(cmd, () => {
      const edt = vscode.window.activeTextEditor;
      if (edt) {
        if (["xml", "svg"].indexOf(edt.document.languageId) !== -1) {
          const doc = PngSaver.getSVGDoc(edt?.document);
          if (typeof doc === "undefined") {
            vscode.window.showErrorMessage("Not editing svg file.");
            return;
          }
          fn(new PngSaver(doc, edt?.document.fileName));
        } else {
          vscode.window.showErrorMessage("You are not editing SVG file.");
          return;
        }
      } else {
        vscode.window.showErrorMessage("No active text editor!");
        return;
      }
    });
    return disposable;
  }

  private static getSVGDoc(txtdoc: vscode.TextDocument): any {
    txtdoc.save();
    var txt = txtdoc.getText();
    try {
      var doc = new xmldoc.XmlDocument(txt);
      if (doc.name.toLowerCase() !== "svg") {
        return undefined;
      }
      return doc;
    } catch {
      return undefined;
    }
  }
}
