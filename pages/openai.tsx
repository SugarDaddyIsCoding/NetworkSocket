import { useCallback } from 'react'
import { useOpenAI } from '@/hooks/useOpenAI'

export default function Test() {
  // TODO: gather user message history and send to api
  // const messages: ChatCompletionRequestMessage[] = [
  //   {
  //     role: 'user',
  //     content: 'Tell me about Elon Musk',
  //   },
  // ]

  const { messages, message, response, handleChange, handleSubmit } =
    useOpenAI()

  const inputRef = useCallback((node: HTMLInputElement) => {
    if (node) {
      node.focus()
    }
  }, [])

  return (
    <div className='flex-center flex-col min-h-screen max-w-xl mx-auto p-8'>
      <div className='flex flex-col flex-1 gap-4 w-full'>
        <div className='min-h-[28px] max-w-full pre-wrap'>{message}</div>
        <div className='min-h-[28px] max-w-full pre-wrap'>{response}</div>
      </div>
      <form
        className='flex justify-between h-[40px] gap-4 w-full max-w-full'
        onSubmit={handleSubmit}
      >
        <input
          ref={inputRef}
          onChange={handleChange}
          value={message}
          className='border-2 border-gray-400 text-gray-700 rounded-md flex-1 w-0 h-full px-2 blue-glow-focus'
        />
        <button
          type='submit'
          disabled={!message}
          className='h-full px-4 rounded-md bg-gray-700 text-gray-200 enabled:hover:bg-gray-800 font-semibold'
        >
          Send
        </button>
      </form>
    </div>
  )
}
