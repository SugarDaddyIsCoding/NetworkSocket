import { ChatCompletionRequestMessage } from 'openai-streams'
import { yieldStream } from 'yield-stream'
import { useEffect, useState } from 'react'
import { useInterval } from './useInterval'

interface OpenAIOptions {
  history?: ChatCompletionRequestMessage[]
}

/**
 * Hello world
 *
 * @returns Everything needed for an OpenAI form
 *
 */
export function useOpenAI(options?: OpenAIOptions) {
  // state hooks
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isStreaming, setStreaming] = useState(false)
  const [cursor, setCursor] = useState(false)

  // pass to api
  const [messages, setMessages] = useState(
    options?.history || new Array<ChatCompletionRequestMessage>()
  )

  // input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    setStreaming(true)

    const tmp = [...messages]
    tmp.push({ role: 'user', content: message })

    try {
      const _response = await fetch('http://localhost:3000/api/openai', {
        method: 'POST',
        body: JSON.stringify({ messages: tmp }),
      })
      if (!_response.ok || !_response.body) {
        const errorText = `[${_response.status}] ${_response.statusText}`

        if (_response.body) {
          const error = await _response.text()
          throw new Error(`${errorText}\n\n${error}`)
        } else {
          throw new Error(errorText)
        }
      }

      let buffer = ''
      for await (const chunk of yieldStream(_response.body)) {
        const decodedChunk = String.fromCharCode(...Array.from(chunk))
        buffer += decodedChunk
        // set
        setResponse(buffer)
      }
      tmp.push({ role: 'assistant', content: buffer })
    } catch (error) {
      console.error(error)
    }

    setResponse('')
    setStreaming(false)
    if (!history) {
      setMessages([...tmp])
    }
  }

  useEffect(() => {
    if (!isStreaming) {
      setMessages([...messages])
    }
  }, [isStreaming])

  useInterval(() => {
    if (isStreaming) {
      setCursor((prev) => !prev)
    } else {
      setCursor(false)
    }
  }, 400)

  return {
    message,
    response,
    handleChange,
    handleSubmit,
    isStreaming,
    cursor,
  }
}
