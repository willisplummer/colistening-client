import React, { useEffect, useState, useRef, useCallback } from 'react';
import socketIOClient from "socket.io-client";

const endpoint = 'http://localhost:4001'

const socket = socketIOClient(endpoint)

const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

function useHookWithRefCallback() {
  const ref = useRef(null)

  const setRef = useCallback(name => node => {
    const emitCurrentTime = e => {
      console.log('emitting')
      socket.emit('data', { name, currentPosition: e.target.currentTime })
    }
    
    const listenerFn = throttle(emitCurrentTime, 500)
  
    if (ref.current) {
      // TODO: This cleanup isn't working correctly
      // Make sure to cleanup any events/references added to the last instance
      ref.current.removeEventListener("timeupdate", listenerFn)
    }
    
    if (node && name) {
      console.log('adding listener', node, name)
      console.log(listenerFn)
       node.addEventListener("timeupdate", listenerFn);  
    }
    
    // Save a reference to the node
    ref.current = node
  }, [])
  
  return setRef
}

const OtherListeners = ({ listeners, name}) => {
  const getTime = currentPosition => {
    if(!isNaN(currentPosition)) {
      return Math.floor(currentPosition / 60) + ':' + ('0' + Math.floor(currentPosition % 60)).slice(-2)
    }
  }

  const otherListeners = listeners.filter(l => l.name !== name)

  return (
    <span>
      <h2>Other Listeners</h2>
      <ul>
        {otherListeners.map(l => <li key={l.name}><b>{l.name}: </b> {getTime(l.currentPosition)}</li>)}
      </ul>
    </span>
  )
}

const PureAudio = React.memo(({ name }) =>  {
  const ref = useHookWithRefCallback()

  return <audio ref={ref(name)} controls src="https://ia800905.us.archive.org/2/items/gd1978-12-16.sonyecm250-no-dolby.walker-scotton.miller.82212.sbeok.flac16/gd78-12-16d3t04.mp3" />
})

function App() {
  const [listeners, setListeners] = useState([])
  const [name, setName] = useState()

  useEffect(() => {
    socket.on('updateListeners', newListeners => {
      console.log('updatingListeners')
      setListeners(newListeners)
    })

    socket.on('setName', newName => {
      setName(newName)
    })
  }, [listeners])

  useEffect(() => console.log(name), [name])

  return (
    <div className="App">
      <h1>Colisten</h1>
      <OtherListeners listeners={listeners} name={name} ></OtherListeners>
      <PureAudio name={name} />
    </div>
  );
}

export default App;
