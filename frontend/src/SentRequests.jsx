import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://worbid.onrender.com'

export default function SentRequests({ currentUser, onBack }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/users/${currentUser.id}/my-requests`)
      .then(res => setRequests(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser.id])

  const pending = requests.filter(r => r.status === 'pending')
  const approved = requests.filter(r => r.status === 'approved')
  const rejected = requests.filter(r => r.status === 'rejected')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">←</button>
          <div className="font-bold text-gray-900">My Connect Requests</div>
        </div>
        <div className="px-5 pt-4">
          {loading && <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>}
          {!loading && requests.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-3xl mb-3">🤝</div>
              <div className="text-sm">No requests sent yet</div>
              <div className="text-xs mt-1">Tap Connect on any listing to get started</div>
            </div>
          )}
          {approved.length > 0 && (
            <>
              <div className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3">✓ Approved — {approved.length}</div>
              {approved.map(req => (
                <div key={req.id} className="bg-white rounded-2xl p-4 mb-3 border border-green-200 shadow-sm">
                  <div className="mb-3">
                    <div className="font-semibold text-gray-900 text-sm">{req.listing?.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{req.listing?.category} · {req.listing?.area}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {req.listing?.user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{req.listing?.user?.name}</div>
                      <div className="text-xs text-gray-500">{req.listing?.user?.area}</div>
                    </div>
                    <a href={`tel:${req.listing?.user?.phone}`}
                      className="bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-700">
                      📞 {req.listing?.user?.phone}
                    </a>
                  </div>
                </div>
              ))}
            </>
          )}
          {pending.length > 0 && (
            <>
              <div className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 mt-4">⏳ Pending — {pending.length}</div>
              {pending.map(req => (
                <div key={req.id} className="bg-white rounded-2xl p-4 mb-3 border border-orange-100 shadow-sm">
                  <div className="font-semibold text-gray-900 text-sm">{req.listing?.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{req.listing?.category} · {req.listing?.area}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-orange-500 font-medium">Waiting for approval...</div>
                    <button onClick={async () => {
                      await axios.delete(`${API}/api/contact-requests/${req.id}`)
                       setRequests(prev => prev.filter(r => r.id !== req.id))
          }} className="text-xs text-gray-400 hover:text-red-500 font-medium">
      Cancel
    </button>
  </div>
</div>
              ))}
            </>
          )}
          {rejected.length > 0 && (
            <>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 mt-4">Declined — {rejected.length}</div>
              {rejected.map(req => (
                <div key={req.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm opacity-60">
                  <div className="font-semibold text-gray-700 text-sm">{req.listing?.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{req.listing?.category} · {req.listing?.area}</div>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="h-8"/>
      </div>
    </div>
  )
}
