import { ChatCompletionRequestMessage } from 'openai-streams'
import { yieldStream } from 'yield-stream'
import { useEffect, useState } from 'react'

/**
 * Hello world
 *
 * @returns Everything needed for an OpenAI form
 *
 */
export function useOpenAI(history?: ChatCompletionRequestMessage[]) {
  // state hooks
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isStreaming, setStreaming] = useState(false)

  // pass to api
  const [messages, setMessages] = useState(
    history || new Array<ChatCompletionRequestMessage>()
  )

  // input change
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
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
        console.log(chunk)
        const decodedChunk = String.fromCharCode(...Array.from(chunk))
        console.log(decodedChunk)
        buffer += decodedChunk
        // set
        setResponse(buffer)
      }
      tmp.push({ role: 'assistant', content: buffer })
    } catch (error) {
      console.error(error)
    }

    setMessages([...tmp])
    setStreaming(false)
  }

  useEffect(() => {
    if (!isStreaming) {
      setMessages([...messages])
    }
  }, [isStreaming])

  return {
    messages,
    message,
    response,
    handleChange,
    handleSubmit,
  }
}
