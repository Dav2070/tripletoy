import { Routes } from "@angular/router"
import { StartPageComponent } from "./pages/start-page/start-page.component"
import { ToyPageComponent } from "./pages/toy-page/toy-page.component"
import { NewToyPageComponent } from "./pages/new-toy-page/new-toy-page.component"
import { ProfileEditPageComponent } from "./pages/profile-edit-page/profile-edit-page.component"
import { UserPageComponent } from "./pages/user-page/user-page.component"
import { NotFoundPageComponent } from "./pages/not-found-page/not-found-page.component"

export const routes: Routes = [
	{ path: "", component: StartPageComponent },
	{ path: "toy/new", component: NewToyPageComponent },
	{ path: "toy/:uuid/edit", component: NewToyPageComponent },
	{ path: "toy/:uuid", component: ToyPageComponent },
	{ path: "user", component: UserPageComponent },
	{ path: "user/edit", component: ProfileEditPageComponent },
	{ path: "**", component: NotFoundPageComponent }
]
