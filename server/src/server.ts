// server.ts — kemet lang lsp server.
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
    import { TextDocuments } 	from 'vscode-languageserver';
    import { TextDocument } 	from 'vscode-languageserver-textdocument';
    import { LSP } 		        from '@je-es/lsp';
    import { KemetSyntax } 		from '@kemet-lang/rules';

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    process.on('uncaughtException', (error) => {
        console.error('[SERVER] UNCAUGHT EXCEPTION:', error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        console.error('[SERVER] UNHANDLED REJECTION:', reason);
        process.exit(1);
    });

    console.log('[SERVER] Starting Kemet LSP Server...');

    try {
        // Create connection and document manager
        const connection 	= createConnection(ProposedFeatures.all);
        const documents 	= new TextDocuments(TextDocument);

        // Initialize the LSP with syntax and workspace root
        const lsp = new LSP(connection, documents, {
            syntax		: KemetSyntax,
            rootPath	: process.cwd(),
            debug       : false,
        });

        // Start the server
        lsp.start();

        console.log('[SERVER] Kemet LSP Server started successfully! 🚀');
    } catch (error) {
        console.error('[SERVER] FATAL ERROR during initialization:', error);
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝