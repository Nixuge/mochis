// Avoid eval warnings from the bundler
export const dynamicEval = Function('return this')()['eval'];