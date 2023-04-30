import { ChatCompletionRequestMessage } from 'openai-streams'

export type Abdul = {
  isModal: boolean
  isChatRoom: boolean
  messages: ChatCompletionRequestMessage[]
  message: string
  response: string
  cursor: boolean
}
