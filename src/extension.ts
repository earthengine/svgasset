'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "svgasset" is now active!');

    var regXmlFunc = function (cmd, fn) {
        let disposable = vscode.commands.registerCommand(cmd, () => {
            var edt = vscode.window.activeTextEditor;
            if (edt) {
                if(edt.document.languageId==='xml') {
                    fn(edt.document);//new PNGSaver(edt.document).saveAsPNG();
                } else {
                    vscode.window.showErrorMessage('You are not editing SVG file.');
                    return;
                }
            } else {
                vscode.window.showErrorMessage('No active text editor!');
                return;
            }
        });
        context.subscriptions.push(disposable);
    }

    regXmlFunc('extension.saveAsPNG', (edt) => {
        new PNGSaver(edt).saveAsPNG();
    });

    regXmlFunc('extension.saveiOSAsset', (edt) => {
        new PNGSaver(edt).saveiOSAsset();
    })
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class PNGSaver {
    private _doc: vscode.TextDocument;
    private _svgtopng = require("svg-to-png");
    private _xmldoc = require("xmldoc");
    private _fs = require("fs");
    private _async = require("async");

    constructor(doc: vscode.TextDocument) {
        this._doc = doc;
    }
    private getSVGDoc() {
        this._doc.save();
        var txt = this._doc.getText();
        try {
            var doc = new this._xmldoc.XmlDocument(txt);
            if (doc.name.toLowerCase() !== "svg") {
                return undefined;
            }
            return doc;
        } catch {
            return undefined;
        }
    }

    public saveAsPNG() {
        try {
            var doc = this.getSVGDoc();
            if(typeof(doc)==="undefined"){
                vscode.window.showErrorMessage('Not editing svg file.');
                return;
            }

            var vbx = doc.attr.viewBox.split(/\s+|,/);

            var fn = this._doc.fileName;
            var pngdir = fn.split('/').slice(0,-1).join('/');
            this._svgtopng.convert(fn, pngdir, {defaultWidth: vbx[2], defaultHeight:vbx[3]});

            vscode.window.showInformationMessage('Converted: ' + fn);
        } catch (e) {
            vscode.window.showErrorMessage(e);
        }
    }

    private _iOSAppIconSet = [
        {size: 20, idiom:"iphone", scale:2},
        {size: 20, idiom:"iphone", scale:3},
        {size: 29, idiom:"iphone", scale:2},
        {size: 29, idiom:"iphone", scale:3},
        {size: 40, idiom:"iphone", scale:2},
        {size: 40, idiom:"iphone", scale:3},
        {size: 60, idiom:"iphone", scale:2},
        {size: 60, idiom:"iphone", scale:3},
        {size: 20, idiom:"ipad", scale:1},
        {size: 20, idiom:"ipad", scale:2},
        {size: 29, idiom:"ipad", scale:1},
        {size: 29, idiom:"ipad", scale:2},
        {size: 40, idiom:"ipad", scale:1},
        {size: 40, idiom:"ipad", scale:2},
        {size: 76, idiom:"ipad", scale:1},
        {size: 76, idiom:"ipad", scale:2},
        {size: 83.5, idiom:"ipad", scale:2},
        {size: 1024, idiom:"ios-marketing", scale:1},
    ];

    public saveiOSAsset() {
        try {
            var doc = this.getSVGDoc();
            if(typeof(doc)==="undefined"){
                vscode.window.showErrorMessage('Not editing svg file.');
                return;
            }

            var fn = this._doc.fileName;
            var fnbase = fn.replace(/^.*[\/]/,'');
            var nfn = fnbase.replace(/[.]svg/, '.png');
            var pngdir = fn.split('/').slice(0,-1).join('/');

            var targetdir = pngdir + "/AppIcon.appiconset";
            if(!this._fs.existsSync(targetdir)) {
                this._fs.mkdirSync(targetdir);
            }

            var that = this;
            var contents = {info: {version: 1, author: "xcode"}, images: []};
            that._async.each(that._iOSAppIconSet, function (e, cb) {
                var tfn = e.idiom+e.size+"@"+e.scale+"x";
                var pngsrc = pngdir+"/"+tfn;
                that._svgtopng.convert(fn, pngsrc, 
                    {defaultWidth: e.size * e.scale, 
                     defaultHeight: e.size * e.scale}).then(function () {
                        that._fs.renameSync(pngsrc + "/" + nfn, targetdir+"/"+tfn+".png");
                        that._fs.rmdirSync(pngsrc);
                        contents.images.push({size: e.size+"x"+e.size,
                                              idiom: e.idiom,
                                              filename: tfn+".png",
                                              scale: e.scale+"x"});
                        cb();
                     });
            }, function() {
                var json = JSON.stringify(contents);
                that._fs.writeFile(targetdir+"/Contents.json", json, function () {
                    vscode.window.showInformationMessage('All done!');
                });
            });
            
            vscode.window.showInformationMessage('Convertion started: ' + fn);
        } catch (e) {
            vscode.window.showErrorMessage(e);
        }
    }
}
//message:"The module '/Users/zhiyuren/Documents/work/svgasset/node_modules/libxmljs/build/Release/xmljs.node'\n
//was compiled against a different Node.js version using\n
//NODE_MODULE_VERSION 57. This version of Node.js requires\n
//NODE_MODULE_VERSION 54. Please try re-compiling or re-installing\n
//the module (for instance, using `npm rebuild` or`npm install`)."
