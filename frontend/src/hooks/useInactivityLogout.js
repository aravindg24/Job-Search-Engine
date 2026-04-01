import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { toast } from '../components/shared/Toast'

const TIMEOUT_MS   = 10 * 60 * 1000  // 10 minutes
const WARNING_MS   =  9 * 60 * 1000  //  9 minutes — warn 1 min before logout

const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export function useInactivityLogout() {
  const navigate       = useNavigate()
  const logoutTimer    = useRef(null)
  const warningTimer   = useRef(null)
  const warnedRef      = useRef(false)

  useEffect(() => {
    function clearTimers() {
      clearTimeout(logoutTimer.current)
      clearTimeout(warningTimer.current)
    }

    async function logout() {
      clearTimers()
      await supabase.auth.signOut()
      navigate('/login', { replace: true, state: { timedOut: true } })
    }

    function resetTimers() {
      clearTimers()
      warnedRef.current = false

      warningTimer.current = setTimeout(() => {
        if (!warnedRef.current) {
          warnedRef.current = true
          toast('You will be signed out in 1 minute due to inactivity.', 'error')
        }
      }, WARNING_MS)

      logoutTimer.current = setTimeout(logout, TIMEOUT_MS)
    }

    // Start timers and attach activity listeners
    resetTimers()
    EVENTS.forEach(ev => window.addEventListener(ev, resetTimers, { passive: true }))

    return () => {
      clearTimers()
      EVENTS.forEach(ev => window.removeEventListener(ev, resetTimers))
    }
  }, [navigate])
}
