import { useState, useEffect, useCallback } from 'react'
import { getStories, createStory, deleteStory } from '../utils/api'

export function useStories() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getStories()
      setStories(data)
    } catch {
      // silently ignore — user may have no stories
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const add = async (story) => {
    const created = await createStory(story)
    setStories(prev => [created, ...prev])
    return created
  }

  const remove = async (id) => {
    await deleteStory(id)
    setStories(prev => prev.filter(s => s.id !== id))
  }

  return { stories, loading, add, remove, fetch }
}
