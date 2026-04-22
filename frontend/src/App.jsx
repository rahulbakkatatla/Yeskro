import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:8080'

function ListingCard({ listing }) {
  const initials = listing.user?.name
    ? listing.user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
    : '??'

  return (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-teal-50 text-teal-700">
          {listing.category}
        </span>
        <span className="text-xs text-gray-400 capitalize">{listing.type}</span>
      </div>
      <h3 className="font-bold text-gray-900 mb-1 text-sm leading-tight">{listing.title}</h3>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{listing.description}</p>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-700">
              {listing.user?.name || 'Anonymous'}
              {listing.user?.isVerified && <span className="text-teal-500 ml-1">✓</span>}
            </div>
            <div className="text-xs text-gray-400">{listing.area}</div>
          </div>
        </div>
        <div className="text-sm font-bold text-gray-900">
          ₹{listing.budgetMin}–{listing.budgetMax}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [activecat, setActivecat] = useState('All')

  const cats = ['All', 'Home Services', 'Music', 'Labour', 'Tutoring', 'Driving']

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/api/listings`)
      setListings(res.data)
      setError(null)
    } catch (err) {
      setError('Could not load listings. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const filtered = listings.filter(l => {
    const matchCat = activecat === 'All' || l.category === activecat
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="flex justify-between items-center px-5 py-4">
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              Wor<span className="text-teal-500">bid</span>
            </div>
            <button
              onClick={() => alert('Post listing — coming soon!')}
              className="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors"
            >
              + Post
            </button>
          </div>

          {/* Search */}
          <div className="px-5 pb-3">
            <input
              type="text"
              placeholder="Search listings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 px-5 pb-4 overflow-x-auto scrollbar-hide">
            {cats.map(cat => (
              <button
                key={cat}
                onClick={() => setActivecat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activecat === cat
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-4">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            {filtered.length} listings · Hyderabad
          </div>

          {loading && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-3xl mb-3">⟳</div>
              <div className="text-sm">Loading listings...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
              <div className="text-red-600 text-sm font-semibold">{error}</div>
              <button onClick={fetchListings} className="mt-2 text-xs text-red-400 underline">
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-3xl mb-3">🔍</div>
              <div className="text-sm">No listings found</div>
            </div>
          )}

          {!loading && filtered.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

      </div>
    </div>
  )
}

export default App
