import type { Command, ScriptMetadata } from './script-loader'
import { ScriptLoader, ScriptLoaderError } from './script-loader'

export { ScriptLoader }
export type { Command, ScriptMetadata }
export { ScriptLoaderError }

const scriptLoader: ScriptLoader = new ScriptLoader()

export { scriptLoader }
