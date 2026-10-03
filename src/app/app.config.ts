import {
	ApplicationConfig,
	inject,
	provideZoneChangeDetection
} from "@angular/core"
import { provideRouter } from "@angular/router"
import { provideHttpClient } from "@angular/common/http"
import { provideApollo } from "apollo-angular"
import { HttpLink } from "apollo-angular/http"
import { InMemoryCache } from "@apollo/client/core"
import { SetContextLink } from "@apollo/client/link/context"
import { Dav } from "dav-js"
import { routes } from "./app.routes"
import { environment } from "src/environments/environment"

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection(),
		provideRouter(routes),
		provideHttpClient(),
		provideApollo(() => {
			const httpLink = inject(HttpLink)

			// Send the access token of the logged in user with every request
			const authLink = new SetContextLink(prevContext => ({
				headers: {
					...prevContext["headers"],
					...(Dav.accessToken ? { Authorization: Dav.accessToken } : {})
				}
			}))

			return {
				cache: new InMemoryCache(),
				link: authLink.concat(
					httpLink.create({ uri: environment.tripletoyApiUrl })
				)
			}
		})
	]
}
