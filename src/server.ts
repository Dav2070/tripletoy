import {
	AngularNodeAppEngine,
	createNodeRequestHandler,
	isMainModule,
	writeResponseToNodeResponse
} from "@angular/ssr/node"
import express from "express"
import { join } from "node:path"

const browserDistFolder = join(import.meta.dirname, "../browser")

const app = express()
// Hosts the app may be served on, comma separated, for example "tripletoy.example.com"
const allowedHosts = (process.env["ALLOWED_HOSTS"] ?? "localhost")
	.split(",")
	.map(host => host.trim())
	.filter(host => host.length > 0)

const angularApp = new AngularNodeAppEngine({ allowedHosts })

// Serve static files from /browser
app.use(
	express.static(browserDistFolder, {
		maxAge: "1y",
		index: false,
		redirect: false
	})
)

// Handle all other requests by rendering the Angular application
app.use((req, res, next) => {
	angularApp
		.handle(req)
		.then(response =>
			response ? writeResponseToNodeResponse(response, res) : next()
		)
		.catch(next)
})

// Start the server if this module is the main entry point
if (isMainModule(import.meta.url) || process.env["pm_id"]) {
	const port = process.env["PORT"] || 4000

	app.listen(port, error => {
		if (error) throw error

		console.log(`Node Express server listening on http://localhost:${port}`)
	})
}

export const reqHandler = createNodeRequestHandler(app)
