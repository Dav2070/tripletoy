import { bootstrapApplication } from "@angular/platform-browser"
import { enableProdMode } from "@angular/core"
import { Environment } from "dav-js"
import { AppComponent } from "./app/app.component"
import { appConfig } from "./app/app.config"
import { environment } from "./environments/environment"

if (
	environment.environment == Environment.Staging ||
	environment.environment == Environment.Production
) {
	enableProdMode()
}

bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err))
