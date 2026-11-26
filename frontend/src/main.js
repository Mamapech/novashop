import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import router from "./router"
import { useAuthStore } from "./stores/auth"
import "./assets/main.css"

const app = createApp(App)
app.use(createPinia())

// Load the logged-in member (if any) before the first page renders,
// so route guards know whether the user is an admin
await useAuthStore().restore()

app.use(router)
app.mount("#app")
