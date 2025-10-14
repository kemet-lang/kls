// client.ts — kemet lang lsp client.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import * as path from 'path';
	import * as fs from 'fs';
	import * as vscode from 'vscode';
	import { workspace, ExtensionContext } from 'vscode';
	import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

	let client: LanguageClient;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

	export function activate(context: ExtensionContext) {
		console.log('🚀 Kemet extension is activating...');

		// The server is implemented in node
		const serverModule = context.asAbsolutePath(
			path.join('server', 'out', 'server.js')
		);

		// If the extension is launched in debug mode then the debug server options are used
		// Otherwise the run options are used
		const serverOptions: ServerOptions = {
			run: { module: serverModule, transport: TransportKind.ipc },
			debug: {
				module: serverModule,
				transport: TransportKind.ipc,
			}
		};

		// Options to control the language client
		const clientOptions: LanguageClientOptions = {
			// Register the server for plain text documents
			documentSelector: [{ scheme: 'file', language: 'kemet' }],
			synchronize: {
				// Notify the server about file changes to '.clientrc files contained in the workspace
				fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
			}
		};

		// Create the language client and start the client.
		client = new LanguageClient(
			'kls',
			'kls',
			serverOptions,
			clientOptions
		);

		// Start the client. This will also launch the server
		client.start();
		console.log('✅ LSP client started');

		// Register commands for Material Icon Theme integration
		console.log('📝 Registering Material Icon Theme commands...');
		context.subscriptions.push(
			vscode.commands.registerCommand('kemet.integrateMaterialIcons', async () => {
				console.log('🔧 Manual integration command triggered');
				await context.globalState.update('kemet.skipMaterialIntegration', false);
				await integrateMaterialIconTheme(context, true);
			})
		);

		context.subscriptions.push(
			vscode.commands.registerCommand('kemet.removeMaterialIntegration', async () => {
				console.log('🗑️ Remove integration command triggered');
				await removeMaterialIntegration(context);
			})
		);
		console.log('✅ Commands registered');

		// Check and integrate with Material Icon Theme on first activation
		const skipIntegration = context.globalState.get('kemet.skipMaterialIntegration');
		console.log(`🔍 Skip integration flag: ${skipIntegration}`);
		if (!skipIntegration) {
			console.log('🎨 Starting Material Icon Theme integration check...');
			integrateMaterialIconTheme(context);
		} else {
			console.log('⏭️ Skipping Material Icon Theme integration (user preference)');
		}

		console.log('✅ Kemet extension activated successfully!');
	}

	export function deactivate(): Thenable<void> | undefined {
		if (!client) {
			return undefined;
		}
		return client.stop();
	}

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔═══════════════════════════ MATERIAL ICON THEME INTEGRATION ══════════════════════════╗

	async function integrateMaterialIconTheme(context: ExtensionContext, force: boolean = false) {
		try {
			console.log('🔍 Looking for Material Icon Theme extension...');

			// Find Material Icon Theme extension
			const materialTheme = vscode.extensions.getExtension('PKief.material-icon-theme');

			if (!materialTheme) {
				console.log('❌ Material Icon Theme not found');
				if (force) {
					vscode.window.showWarningMessage('Material Icon Theme is not installed.');
				}
				return;
			}

			console.log('✅ Material Icon Theme found at:', materialTheme.extensionPath);

			const materialPath = materialTheme.extensionPath;
			const iconsPath = path.join(materialPath, 'icons');
			const configPath = path.join(materialPath, 'dist', 'material-icons.json');

			console.log('📁 Icons path:', iconsPath);
			console.log('📄 Config path:', configPath);

			// Check if already integrated
			const kemetIconPath = path.join(iconsPath, 'kemet.svg');
			console.log('🔍 Checking if Kemet icon exists at:', kemetIconPath);

			if (fs.existsSync(kemetIconPath) && !force) {
				console.log('✅ Kemet icon already integrated with Material Icon Theme');
				return;
			}

			if (fs.existsSync(kemetIconPath)) {
				console.log('⚠️ Icon exists but force=true, will overwrite');
			} else {
				console.log('📝 Icon does not exist, will create');
			}

			// Ask user for permission (only if not forced)
			if (!force) {
				console.log('💬 Asking user for permission...');
				const answer = await vscode.window.showInformationMessage(
					'Would you like to add Kemet file icons to Material Icon Theme?',
					'Yes', 'No', 'Don\'t ask again'
				);

				console.log('👤 User answer:', answer);

				if (answer === 'Don\'t ask again') {
					console.log('🚫 User chose "Don\'t ask again"');
					await context.globalState.update('kemet.skipMaterialIntegration', true);
					return;
				}

				if (answer !== 'Yes') {
					console.log('⏭️ User declined integration');
					return;
				}

				console.log('✅ User approved integration');
			}

			// Copy Kemet icon
			const kemetSvgSource = path.join(context.extensionPath, 'icons', 'kemet-file.svg');
			console.log('📂 Source icon path:', kemetSvgSource);

			if (!fs.existsSync(kemetSvgSource)) {
				console.error('❌ Kemet icon source not found at:', kemetSvgSource);
				vscode.window.showErrorMessage('Kemet icon file not found. Please reinstall the extension.');
				return;
			}

			console.log('✅ Source icon found');

			// Check if icons directory exists
			if (!fs.existsSync(iconsPath)) {
				console.error('❌ Material Icon Theme icons directory not found');
				vscode.window.showErrorMessage('Material Icon Theme icons directory not found.');
				return;
			}

			// Copy SVG file
			console.log('📋 Copying icon file...');
			fs.copyFileSync(kemetSvgSource, kemetIconPath);
			console.log('✅ Kemet icon copied to Material Icon Theme');

			// Update material-icons.json
			if (fs.existsSync(configPath)) {
				console.log('📝 Reading Material Icon Theme config...');
				const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
				console.log('✅ Config loaded');

				// Add icon definition
				if (!config.iconDefinitions) {
					console.log('⚠️ iconDefinitions not found, creating...');
					config.iconDefinitions = {};
				}
				config.iconDefinitions['kemet'] = {
					iconPath: '../icons/kemet.svg'
				};
				console.log('✅ Icon definition added');

				// Add file extensions
				if (!config.fileExtensions) {
					console.log('⚠️ fileExtensions not found, creating...');
					config.fileExtensions = {};
				}
				config.fileExtensions['k'] = 'kemet';
				config.fileExtensions['kemet'] = 'kemet';
				console.log('✅ File extensions added');

				// Add language IDs
				if (!config.languageIds) {
					console.log('⚠️ languageIds not found, creating...');
					config.languageIds = {};
				}
				config.languageIds['kemet'] = 'kemet';
				console.log('✅ Language IDs added');

				// Write updated config
				console.log('💾 Writing updated config...');
				fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
				console.log('✅ Material Icon Theme config updated successfully!');

				// Show success message
				const reload = await vscode.window.showInformationMessage(
					'Kemet icons added to Material Icon Theme! Reload VS Code to see changes.',
					'Reload Now', 'Later'
				);

				if (reload === 'Reload Now') {
					console.log('🔄 Reloading window...');
					vscode.commands.executeCommand('workbench.action.reloadWindow');
				} else {
					console.log('⏭️ User chose to reload later');
				}
			} else {
				console.error('❌ Material Icon Theme config file not found at:', configPath);
				vscode.window.showErrorMessage('Material Icon Theme config file not found.');
			}

		} catch (error) {
			console.error('❌ Error integrating with Material Icon Theme:', error);
			if (error instanceof Error) {
				console.error('Error message:', error.message);
				console.error('Error stack:', error.stack);
			}
			vscode.window.showErrorMessage(
				'Failed to integrate Kemet icons with Material Icon Theme. Check the console for details. You may need to run VS Code with appropriate permissions.'
			);
		}
	}

	async function removeMaterialIntegration(context: ExtensionContext) {
		try {
			const materialTheme = vscode.extensions.getExtension('PKief.material-icon-theme');

			if (!materialTheme) {
				vscode.window.showWarningMessage('Material Icon Theme is not installed.');
				return;
			}

			const materialPath = materialTheme.extensionPath;
			const kemetIconPath = path.join(materialPath, 'icons', 'kemet.svg');
			const configPath = path.join(materialPath, 'dist', 'material-icons.json');

			// Remove icon file
			if (fs.existsSync(kemetIconPath)) {
				fs.unlinkSync(kemetIconPath);
			}

			// Update config
			if (fs.existsSync(configPath)) {
				const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

				// Remove icon definition
				if (config.iconDefinitions && config.iconDefinitions['kemet']) {
					delete config.iconDefinitions['kemet'];
				}

				// Remove file extensions
				if (config.fileExtensions) {
					delete config.fileExtensions['k'];
					delete config.fileExtensions['kemet'];
				}

				// Remove language IDs
				if (config.languageIds && config.languageIds['kemet']) {
					delete config.languageIds['kemet'];
				}

				fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
			}

			const reload = await vscode.window.showInformationMessage(
				'Kemet icons removed from Material Icon Theme. Reload VS Code to see changes.',
				'Reload Now', 'Later'
			);

			if (reload === 'Reload Now') {
				vscode.commands.executeCommand('workbench.action.reloadWindow');
			}

		} catch (error) {
			console.error('Error removing Kemet integration:', error);
			vscode.window.showErrorMessage('Failed to remove Kemet icons from Material Icon Theme.');
		}
	}

// ╚══════════════════════════════════════════════════════════════════════════════════════╝