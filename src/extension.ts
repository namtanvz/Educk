// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { join } from 'path';
import * as vscode from 'vscode';
import { ExtensionContext, ExtensionMode, Uri, Webview } from 'vscode';
import { MessageHandlerData } from '@estruyf/vscode';
import * as fs from 'fs';
import stripAnsi from "strip-ansi";

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('educk.openWebview', () => {
		const panel = vscode.window.createWebviewPanel(
			'react-webview',
			'Educk',
			vscode.ViewColumn.Beside,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);
		panel.webview.onDidReceiveMessage(async (message) => {
			const {command, payload} = message;
			await vscode.commands.executeCommand(
				"workbench.action.focusFirstEditorGroup"
			);
			if (command === 'GET_EDITOR_TEXT'){
				panel.webview.postMessage({
					command,
					payload: getEditorText()
				} as MessageHandlerData<string>);
				vscode.window.showInformationMessage('Educk🦆: Quack the code');
			}
      // else if (command === "GET_EDITOR_ERROR") {
      //   panel.webview.postMessage({
      //     command,
      //     payload: getEditorError(),
      //   } as MessageHandlerData<Array<any>>);
      //   vscode.window.showInformationMessage("Educk🦆: Quack the editor errors.");
      // }
      else if (command === "GET_TERMINAL_ERROR") {
        panel.webview.postMessage({
          command,
          payload: getTerminalText(),
        } as MessageHandlerData<string>);
        vscode.window.showInformationMessage("Educk🦆: Quack the code and errors.");
      }
		});
		panel.webview.html = getWebviewContent(context, panel.webview);
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

//the functions use within the webview
function getEditorText() {
	const editorText = vscode.window.activeTextEditor?.document.getText();
	return editorText;
}

function getEditorError() {
	const diagnostics = vscode.languages.getDiagnostics();
	return diagnostics;
}

function getTerminalText() {
  const workspacePath = vscode.workspace.workspaceFolders;
  let lastFormattedErrors = "";

  if (workspacePath) {
    const terminalTextPath = join(workspacePath[0].uri.fsPath, '.educk', 'out.txt');

    let terminalText = '';
    try {
      terminalText = fs.readFileSync(terminalTextPath, "utf8");
    } catch (error) {
      console.error('Failed to read terminal text:', error);
      return '';
    }

    let cleanedText = stripAnsi(terminalText)
    .replace(/[^\x00-\x7F]+/g, "")
    .trim();

    const errorRegex = /Traceback \(most recent call last\):[\s\S]*?(\w+Error: .+)/g;
    let matches = cleanedText.match(errorRegex);
    let lastFormattedErrors = "";

    if (matches) {
        matches.forEach((error) => {
            lastFormattedErrors += error.trim() + ' '; // Collect errors
        });
    }
  }
  return lastFormattedErrors;
}



const getWebviewContent = (context: ExtensionContext, webview: Webview) => {
	const jsFile = "webview.js";
	const localServerUrl = "http://localhost:9000";

	let scriptUrl = null;
	let cssUrl = null;

	const isProduction = context.extensionMode === ExtensionMode.Production;
	if (isProduction) {
		scriptUrl = webview.asWebviewUri(Uri.file(join(context.extensionPath, 'dist', jsFile))).toString();
	} else {
		scriptUrl = `${localServerUrl}/${jsFile}`; 
	}

	return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		${isProduction ? `<link href="${cssUrl}" rel="stylesheet">` : ''}
	</head>
	<body>
		<div id="root"></div>

		<script src="${scriptUrl}"></script>
	</body>
	</html>`;
};
