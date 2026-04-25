import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'https://worbid.onrender.com'
const CATEGORIES = ['Home Services', 'Music', 'Labour', 'Tutoring', 'Driving', 'Other']

function ListingCard({ listing }) {
  const initials = listing.user?.name
    ? listing.user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
    : '??'

  return (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-teal-50 text-teal-700">{listing.category}</span>
        <span className="text-xs text-gray-400 capitalize">{listing.type}</span>
      </div>
      <h3 className="font-bold text-gray-900 mb-1 text-sm leading-tight">{listing.title}</h3>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{listing.description}</p>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          <div>
            <div className="text-xs font-semibold text-gray-700">
              {listing.user?.name || 'Anonymous'}
              {listing.user?.isVerified && <span className="text-teal-500 ml-1">✓</span>}
            </div>
            <div className="text-xs text-gray-400">{listing.area}</div>
          </div>
        </div>
        <div className="text-sm font-bold text-gray-900">₹{listing.budgetMin}–{listing.budgetMax}</div>
      </div>
    </div>
  )
}

function RegisterPage({ onRegister }) {
  const [form, setForm] = useState({ name: '', phone: '', area: '', city: 'Hyderabad', bio: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.phone.trim() || form.phone.length !== 10) { setError('Enter valid 10 digit phone number'); return }
    if (!form.area.trim()) { setError('Area is required'); return }
    try {
      setLoading(true)
      setError(null)
      const res = await axios.post(`${API}/api/users/register`, form)
      onRegister(res.data)
    } catch (err) {
      if (err.response?.status === 400) {
        setError('Phone number already registered. Try a different number.')
      } else {
        setError('Registration failed. Is the backend running?')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-sm border border-gray-100">

        <div className="text-center mb-8">
          <div className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            Wor<span className="text-teal-500">bid</span>
          </div>
          <div className="text-sm text-gray-500">Create your verified profile</div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">{error}</div>
        )}

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Full name</label>
          <input name="name" value={form.name} onChange={handle}
            placeholder="e.g. Rahul Yadav"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"/>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Phone number</label>
          <input name="phone" value={form.phone} onChange={handle}
            placeholder="10 digit mobile number" type="tel" maxLength={10}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"/>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Your area</label>
          <input name="area" value={form.area} onChange={handle}
            placeholder="e.g. Banjara Hills"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"/>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">City</label>
          <input name="city" value={form.city} onChange={handle}
            placeholder="e.g. Hyderabad"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"/>
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Bio (optional)</label>
          <textarea name="bio" value={form.bio} onChange={handle} rows={2}
            placeholder="Tell people what you can do..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors resize-none"/>
        </div>

        <button onClick={submit} disabled={loading}
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-gray-700 transition-colors disabled:opacity-50">
          {loading ? 'Creating profile...' : 'Create profile →'}
        </button>

        <div className="text-center mt-4 text-xs text-gray-400">
          By registering you agree to Worbid's terms of service
        </div>
      </div>
    </div>
  )
}

function PostModal({ onClose, onSuccess, currentUser }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Home Services',
    type: 'offering', area: currentUser?.area || '', city: currentUser?.city || 'Hyderabad',
    budgetMin: '', budgetMax: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.area.trim()) { setError('Area is required'); return }
    try {
      setLoading(true)
      setError(null)
      await axios.post(`${API}/api/listings`, {
        ...form,
        budgetMin: parseFloat(form.budgetMin) || 0,
        budgetMax: parseFloat(form.budgetMax) || 0,
        user: { id: currentUser.id }
      })
      onSuccess()
    } catch (err) {
      setError('Failed to post listing. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-xl font-black text-gray-900">Post a listing</div>
            <div className="text-xs text-gray-400 mt-1">Posting as {currentUser?.name}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">{error}</div>
        )}

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">I am</label>
          <div className="flex gap-2">
            {['offering', 'seeking'].map(t => (
              <button key={t} onClick={() => setForm({...form, type: t})}
                className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${
                  form.type === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                {t === 'offering' ? '🙋 Offering' : '🤝 Seeking'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Title</label>
          <input name="title" value={form.title} onChange={handle}
            placeholder="e.g. Available for car cleaning today"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"/>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setForm({...form, category: cat})}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all text-left ${
                  form.category === cat ? 'bg-teal-500 text-white' : 'bg-gray-50 text-gray-500'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Description</label>
          <textarea name="description" value={form.description} onChange={handle} rows={3}
            placeholder="Describe what you can do or what you need..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors resize-none"/>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Your area</label>
          <input name="area" value={form.area} onChange={handle}
            placeholder="e.g. Banjara Hills"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"/>
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Budget (₹)</label>
          <div className="flex gap-2">
            <input name="budgetMin" value={form.budgetMin} onChange={handle}
              placeholder="Min" type="number"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"/>
            <input name="budgetMax" value={form.budgetMax} onChange={handle}
              placeholder="Max" type="number"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"/>
          </div>
        </div>

        <button onClick={submit} disabled={loading}
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-gray-700 transition-colors disabled:opacity-50">
          {loading ? 'Posting...' : 'Post listing →'}
        </button>
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
  const [showModal, setShowModal] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  const cats = ['All', ...CATEGORIES]

  useEffect(() => {
    const saved = localStorage.getItem('worbid_user')
    if (saved) setCurrentUser(JSON.parse(saved))
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

  const handleRegister = (user) => {
    setCurrentUser(user)
    localStorage.setItem('worbid_user', JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('worbid_user')
  }

  const handlePostSuccess = () => {
    setShowModal(false)
    fetchListings()
  }

  const filtered = listings.filter(l => {
    const matchCat = activecat === 'All' || l.category === activecat
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  if (!currentUser) return <RegisterPage onRegister={handleRegister} />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="flex justify-between items-center px-5 py-4">
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              Wor<span className="text-teal-500">bid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500 font-medium">Hi, {currentUser.name.split(' ')[0]}</div>
              <button onClick={() => setShowModal(true)}
                className="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-700 transition-colors">
                + Post
              </button>
              <button onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                logout
              </button>
            </div>
          </div>
          <div className="px-5 pb-3">
            <input type="text" placeholder="Search listings..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 transition-colors"/>
          </div>
          <div className="flex gap-2 px-5 pb-4 overflow-x-auto">
            {cats.map(cat => (
              <button key={cat} onClick={() => setActivecat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activecat === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

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
              <button onClick={fetchListings} className="mt-2 text-xs text-red-400 underline">Try again</button>
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

      {showModal && (
        <PostModal
          onClose={() => setShowModal(false)}
          onSuccess={handlePostSuccess}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}

export default App
