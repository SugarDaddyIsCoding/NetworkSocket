import { ChatCompletionRequestMessage } from 'openai-streams'

export type Abdul = {
  isModal: boolean
  isChatRoom: boolean
  nameRef: string
  messages: ChatCompletionRequestMessage[]
  message: string
  response: string
  messageRef: string
  responseRef: string
  cursor: boolean
}
