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

  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [messageRef, setMessageRef] = useState('')
  const [responseRef, setResponseRef] = useState('')
  const [toggle, setToggle] = useState(false)
  const cursor = !!response && toggle

  // useEffect(() => {
  //   if (!response) {
  //   }
  // }, [response])

  // input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value)
  }

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setMessageRef(message)
    setMessage('')

    const tmp = [...messages]
    tmp.push({
      role: 'user',
      content: message,
    })
    try {
      const _response = await fetch('http://localhost:3000/api/openai', {
        method: 'POST',
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
        // set
        setResponse(buffer)
      }
      setResponseRef(buffer)
    } catch (error) {
      console.error(error)
    }
    setResponse('')
  }

  useInterval(() => {
    if (response) {
      setToggle((prev) => !prev)
    }
  }, 400)

  return {
    messages,
    message,
    response,
    messageRef,
    responseRef,
    handleChange,
    handleSubmit,
    cursor,
  }
}
