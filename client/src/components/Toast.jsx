import { useEffect, useState } from 'react'

let pushToast = null

export function toast(message, type = 'info') {
  pushToast?.({ message, type, id: Date.now() })
}

export function ToastHost() {
  const [items, setItems] = useState([])

  useEffect(() => {
    pushToast = (item) => {
      setItems((prev) => [...prev, item])
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id))
      }, 3500)
    }
    return () => {
      pushToast = null
    }
  }, [])

  return (
    <>
      {items.map((t) => (
        <div key={t.id} className={`toast-banner ${t.type}`}>
          <span>{t.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
          >
            ×
          </button>
        </div>
      ))}
    </>
  )
}
