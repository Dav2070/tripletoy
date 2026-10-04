export const smallWindowMaxSize = 576
export const navbarHeight = 76
export const toysPageSize = 24
export const profileAgeMin = 1
export const profileAgeMax = 120
export const profileDescriptionMaxLength = 1000
// Price limits in cents, same as in the API
export const toyPriceMin = 50
export const toyPriceMax = 100_000
export const profileAddressFieldMaxLength = 100
export const profilePhoneRegex = /^[0-9+()/.\- ]{3,30}$/
export const toyPhotoMaxCount = 10
export const toyPhotoMaxBytes = 10 * 1024 * 1024
export const toyPhotoTypes = ["image/jpeg", "image/png", "image/webp"]
export const defaultProfileImageUrl =
	"/assets/images/profile-image-placeholder.png"
export const defaultToyImageUrl = "/assets/images/toy-placeholder.svg"
