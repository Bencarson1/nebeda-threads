import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../../utils/analytics'

function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    const pagePath = location.pathname.startsWith('/review/') ? '/review/:token' : location.pathname
    trackPageView(pagePath)
  }, [location.pathname])

  return null
}

export default AnalyticsTracker
