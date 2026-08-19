import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

const APPLOVIN_EVENT_KEY = '2b55b9a4-51bf-42b9-8ee5-efc253902359'
let lastTrackedPage = ''

declare global {
  interface Window {
    axon?: (...args: unknown[]) => void
  }
}

export const AppLovinPixel = () => {
  const location = useLocation()

  useEffect(() => {
    const page = `${location.pathname}${location.search}`
    if (lastTrackedPage === page) return

    const sendPageView = () => {
      if (!window.axon) {
        window.setTimeout(sendPageView, 50)
        return
      }

      lastTrackedPage = page
      window.axon('track', 'page_view')
    }

    sendPageView()
  }, [location.pathname, location.search])

  return (
    <Helmet>
      <script>
        {`var AXON_EVENT_KEY="${APPLOVIN_EVENT_KEY}";
!function(e,r){var t=["https://s.axon.ai/pixel.js","https://res4.applovin.com/p/l/loader.iife.js"];if(!e.axon){var a=e.axon=function(){a.performOperation?a.performOperation.apply(a,arguments):a.operationQueue.push(arguments)};a.operationQueue=[],a.ts=Date.now(),a.eventKey=AXON_EVENT_KEY;for(var n=r.getElementsByTagName("script")[0],o=0;o<t.length;o++){var i=r.createElement("script");i.async=!0,i.src=t[o],n.parentNode.insertBefore(i,n)}}}(window,document);
axon("init");`}
      </script>
    </Helmet>
  )
}
