import { Injectable } from "@angular/core"
import { Position } from "src/app/misc/types"

/** Determines the location of the user once and shares it between the pages */
@Injectable({ providedIn: "root" })
export class LocationService {
	/** The position rounded to about one kilometer, null if it is not known (yet) */
	position: Position = null
	/** The user does not share the location */
	unavailable: boolean = false
	private determination: Promise<void> = null

	/** Returns whether the browser can answer without asking the user */
	async getPermission(): Promise<PermissionState> {
		try {
			const status = await navigator.permissions.query({
				name: "geolocation"
			})

			return status.state
		} catch {
			// Not supported, the browser asks when the location is requested
			return "prompt"
		}
	}

	markUnavailable() {
		this.unavailable = true
	}

	/** Determines the position, later calls wait for the same answer */
	determine(): Promise<void> {
		this.determination ??= this.run()
		return this.determination
	}

	private async run() {
		try {
			this.position = await this.getCurrentPosition()
		} catch (error) {
			console.error(error)
			this.unavailable = true
		}
	}

	/** The position is rounded to about one kilometer, that is enough for the approximate positions */
	private getCurrentPosition(): Promise<Position> {
		return new Promise((resolve, reject) => {
			if (!navigator.geolocation) {
				reject(new Error("Geolocation is not supported"))
				return
			}

			navigator.geolocation.getCurrentPosition(
				result =>
					resolve({
						latitude: Math.round(result.coords.latitude * 100) / 100,
						longitude: Math.round(result.coords.longitude * 100) / 100
					}),
				error => reject(error),
				{ timeout: 10000, maximumAge: 5 * 60 * 1000 }
			)
		})
	}
}
