Using Vue version 2 and not 3
- Vue 3 doesn't have buefy support hence have to use other UI framework
- Uses @Option rather than @Component and uses vue_class_components rather than vue_component_decorator 

For Buefy Table to work
- ensure the project uses Vue 2 and not 3
- ensure buefy is installed
- import Buefy and "buefy/dist/buefy.css" and set Vue.use(Buefy) in main.ts 