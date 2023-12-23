// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { join } from 'path';
import * as vscode from 'vscode';
import { ExtensionContext, ExtensionMode, Uri, Webview } from 'vscode';
import { MessageHandlerData } from '@estruyf/vscode';

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
			const { command, requestId, payload } = message;
			await vscode.commands.executeCommand(
				"workbench.action.focusFirstEditorGroup"
			);
			if (command === 'GET_EDITOR_TEXT'){
          panel.webview.postMessage({
            command,
            requestId,
            payload: getEditorText(),
          } as MessageHandlerData<string>) ;
				vscode.window.showInformationMessage('Educk🦆: Quack the code');
			}
      else if (command === "GET_EDITOR_ERROR") {
        panel.webview.postMessage({
          command,
          payload: getEditorError(),
        } as MessageHandlerData<string>);
        vscode.window.showInformationMessage("Educk🦆: Quack the editor errors,");
      }
		}, context.subscriptions);
		panel.webview.html = getWebviewContent(context, panel.webview);
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

//the functions use within the webview
function getEditorText() {
  const editor = vscode.window.activeTextEditor;
  if(editor){
    const editorText = editor.document.getText();
    vscode.window.showInformationMessage(`All text in the file: ${editorText}`);
    return editorText;
  }
  else{
    vscode.window.showInformationMessage(`No active editor`);
    return ;
  }
}

function getEditorError() {
	const diagnostics = vscode.languages.getDiagnostics();
  return diagnostics.join(',');
  
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
