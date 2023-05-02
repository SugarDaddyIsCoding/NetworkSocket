import { ChatCompletionRequestMessage } from 'openai-streams'

export type Abdul = {
  mIdRef: string | null
  rIdRef: string | null
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
