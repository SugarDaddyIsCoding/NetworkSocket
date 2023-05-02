import { ChatCompletionRequestMessage } from 'openai-streams'
import { yieldStream } from 'yield-stream'
import { useEffect, useRef, useState } from 'react'
import { useInterval } from './useInterval'

interface OpenAIOptions {
  messages?: ChatCompletionRequestMessage[]
}

/**
 * Hello world
 *
 * @returns Everything needed for an OpenAI form
 *
 */
export function useOpenAI(options?: OpenAIOptions) {
  // state hooks
  const messages =
    options?.messages ?? new Array<ChatCompletionRequestMessage>()

  const [isError, setError] = useState(false)
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [messageRef, setMessageRef] = useState('')
  const [responseRef, setResponseRef] = useState('')
  const [toggle, setToggle] = useState(false)
  const cursor = !!response && toggle

  const reset = () => {
    setError(false)
    setMessage('')
    setResponse('')
    setMessageRef('')
    setResponseRef('')
    setToggle(false)
  }

  // input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value)
  }

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setMessageRef(message)
    setMessage('')
    setError(false)

    const tmp = [...messages]
    tmp.push({
      role: 'user',
      content: message,
    })
    try {
      const _response = await fetch('/api/openai', {
        mode: 'no-cors',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: tmp,
        }),
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
        setResponse(buffer)
      }
      setResponseRef(buffer)
    } catch (error) {
      console.error(error)
      setError(true)
    }
    setResponse('')
  }

  useInterval(() => {
    if (response) {
      setToggle((prev) => !prev)
    }
  }, 400)

  return {
    isError,
    setError,
    messages,
    message,
    response,
    messageRef,
    responseRef,
    setMessageRef,
    setResponseRef,
    handleChange,
    handleSubmit,
    cursor,
    reset,
  }
}
