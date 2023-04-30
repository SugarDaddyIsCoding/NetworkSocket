import { ChatCompletionRequestMessage } from 'openai-streams'

export type Abdul = {
  isModal: boolean
  isChatRoom: boolean
  isStreaming: boolean
  history: ChatCompletionRequestMessage[]
  refMessage: string
  response: string
  refResponse: string
  cursor: boolean
}