import type { ChildCommand } from '../enums/child-command'
import type { JobJson } from './job-json'

export interface ParentMessage {
  cmd: ChildCommand
  value?: any
  err?: Error
  job?: JobJson
}
