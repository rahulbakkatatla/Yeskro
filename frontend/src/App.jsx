import { useState, useEffect } from 'react'
import axios from 'axios'
import SentRequests from './SentRequests'
import { auth } from './firebase'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

const API = 'https://worbid.onrender.com'
const CATEGORIES = ['Home Services', 'Music', 'Labour', 'Tutoring', 'Driving', 'Other']

function AuthPage({ onAuth }) {
  const [tab, setTab] = useState('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [form, setForm] = useState({ name: '', area: '', city: 'Hyderabad', bio: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [step, setStep] = useState('form')
  const [confirmationResult, setConfirmationResult] = useState(null)

  const clear = () => { setError(null); setSuccess(null) }

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      })
    }
    return window.recaptchaVerifier
  }

  const handleLogin = async () => {
    if (phone.length !== 10) { setError('Enter valid 10 digit phone number'); return }
    if (!password.trim()) { setError('Enter your password'); return }
    try {
      setLoading(true); clear()
      const res = await axios.post(`${API}/api/users/login`, { phone, password })
      onAuth(res.data, keepLoggedIn)
    } catch (err) {
      if (err.response?.status === 404) setError('Phone not registered. Create an account.')
      else if (err.response?.status === 401) setError('Wrong password. Try again.')
      else setError('Something went wrong. Try again.')
    } finally { setLoading(false) }
  }

  const handleSendOtp = async (purpose) => {
    if (phone.length !== 10) { setError('Enter valid 10 digit phone number'); return }
    if (purpose === 'register') {
      if (password.length < 6) { setError('Password must be at least 6 characters'); return }
      if (!form.name.trim()) { setError('Name is required'); return }
      if (!form.area.trim()) { setError('Area is required'); return }
      try {
        await axios.get(`${API}/api/users/phone/${phone}`)
        setError('Phone already registered. Login instead.')
        return
      } catch (err) {
        if (err.response?.status !== 404) { setError('Something went wrong.'); return }
      }
    }
    if (purpose === 'reset') {
      try {
        await axios.get(`${API}/api/users/phone/${phone}`)
      } catch (err) {
        setError('Phone not registered.')
        return
      }
    }
    try {
      setLoading(true); clear()
      const verifier = setupRecaptcha()
      const result = await signInWithPhoneNumber(auth, '+91' + phone, verifier)
      setConfirmationResult(result)
      setStep('otp')
      setSuccess('OTP sent to +91' + phone)
    } catch (err) {
      console.error(err)
      setError('Failed to send OTP. Try again.')
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear()
        window.recaptchaVerifier = null
      }
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async (purpose) => {
    if (otp.length !== 6) { setError('Enter 6 digit OTP'); return }
    try {
      setLoading(true); clear()
      await confirmationResult.confirm(otp)
      if (purpose === 'register') {
        const res = await axios.post(`${API}/api/users/register`, { ...form, phone, password })
        onAuth(res.data, keepLoggedIn)
      } else if (purpose === 'reset') {
        setStep('newpassword')
      }
    } catch (err) {
      setError('Invalid OTP. Try again.')
    } finally { setLoading(false) }
  }

  const handleReset = async () => {
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    try {
      setLoading(true); clear()
      await axios.post(`${API}/api/users/reset-password`, { phone, newPassword })
      setStep('done')
      setSuccess('Password reset successfully!')
    } catch { setError('Reset failed. Try again.') }
    finally { setLoading(false) }
  }

  const switchTab = (t) => {
    setTab(t); clear(); setStep('form')
    setPhone(''); setPassword(''); setOtp('')
    setConfirmationResult(null)
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear()
      window.recaptchaVerifier = null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-sm border border-gray-100">
        <div className="text-center mb-6">
          <div className="text-3xl font-black text-gray-900 tracking-tight mb-1">Wor<span className="text-teal-500">bid</span></div>
          <div className="text-sm text-gray-500">
            {tab === 'login' ? 'Welcome back' : tab === 'register' ? 'Create your account' : 'Reset your password'}
          </div>
        </div>

        <div id="recaptcha-container"></div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {['login', 'register', 'reset'].map(t => (
            <button key={t} onClick={() => switchTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
              {t === 'reset' ? '🔑 Reset' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-600">{success}</div>}

        {/* LOGIN */}
        {tab === 'login' && (
          <>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Phone number</label>
              <input value={phone} onChange={e => { setPhone(e.target.value); clear() }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="10 digit mobile number" type="tel" maxLength={10} autoComplete="off"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 tracking-widest font-bold text-center"/>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Password</label>
              <input value={password} onChange={e => { setPassword(e.target.value); clear() }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Your password" type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <input type="checkbox" id="keep" checked={keepLoggedIn} onChange={e => setKeepLoggedIn(e.target.checked)} className="w-4 h-4 accent-teal-500"/>
              <label htmlFor="keep" className="text-xs text-gray-500 cursor-pointer">Keep me logged in</label>
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Logging in...' : 'Login →'}
            </button>
            <div className="text-center mt-3 text-xs text-gray-400">
              Don't have an account? <button onClick={() => switchTab('register')} className="text-teal-600 font-semibold">Register</button>
            </div>
            <div className="text-center mt-2 text-xs text-gray-400">
              Forgot password? <button onClick={() => switchTab('reset')} className="text-teal-600 font-semibold">Reset here</button>
            </div>
          </>
        )}

        {/* REGISTER */}
        {tab === 'register' && step === 'form' && (
          <>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Phone number</label>
              <input value={phone} onChange={e => { setPhone(e.target.value); clear() }}
                placeholder="10 digit mobile number" type="tel" maxLength={10} autoComplete="off"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 tracking-widest font-bold text-center"/>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Password</label>
              <input value={password} onChange={e => { setPassword(e.target.value); clear() }}
                placeholder="Min 6 characters" type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Full name</label>
              <input value={form.name} onChange={e => { setForm({...form, name: e.target.value}); clear() }}
                placeholder="e.g. Rahul Yadav"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Your area</label>
              <input value={form.area} onChange={e => { setForm({...form, area: e.target.value}); clear() }}
                placeholder="e.g. Banjara Hills"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">City</label>
              <input value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                placeholder="e.g. Hyderabad"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            </div>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Bio (optional)</label>
              <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={2}
                placeholder="Tell people what you can do..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 resize-none"/>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <input type="checkbox" id="keep2" checked={keepLoggedIn} onChange={e => setKeepLoggedIn(e.target.checked)} className="w-4 h-4 accent-teal-500"/>
              <label htmlFor="keep2" className="text-xs text-gray-500 cursor-pointer">Keep me logged in</label>
            </div>
            <button onClick={() => handleSendOtp('register')} disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Sending OTP...' : 'Send OTP →'}
            </button>
            <div className="text-center mt-3 text-xs text-gray-400">
              Already have an account? <button onClick={() => switchTab('login')} className="text-teal-600 font-semibold">Login</button>
            </div>
          </>
        )}

        {tab === 'register' && step === 'otp' && (
          <>
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Enter OTP sent to +91{phone}</label>
              <input value={otp} onChange={e => { setOtp(e.target.value); clear() }}
                placeholder="6 digit OTP" type="tel" maxLength={6} autoComplete="off"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 tracking-widest font-bold text-center text-lg"/>
            </div>
            <button onClick={() => handleVerifyOtp('register')} disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Create Account →'}
            </button>
            <button onClick={() => handleSendOtp('register')} className="w-full mt-3 py-2 text-xs text-teal-600">Resend OTP</button>
            <button onClick={() => { setStep('form'); clear() }} className="w-full mt-1 py-2 text-xs text-gray-400">← Change details</button>
          </>
        )}

        {/* RESET */}
        {tab === 'reset' && step === 'form' && (
          <>
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Your registered phone number</label>
              <input value={phone} onChange={e => { setPhone(e.target.value); clear() }}
                placeholder="10 digit mobile number" type="tel" maxLength={10} autoComplete="off"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 tracking-widest font-bold text-center"/>
            </div>
            <button onClick={() => handleSendOtp('reset')} disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Sending OTP...' : 'Send OTP →'}
            </button>
            <div className="text-center mt-3 text-xs text-gray-400">
              Remember it? <button onClick={() => switchTab('login')} className="text-teal-600 font-semibold">Back to login</button>
            </div>
          </>
        )}

        {tab === 'reset' && step === 'otp' && (
          <>
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Enter OTP sent to +91{phone}</label>
              <input value={otp} onChange={e => { setOtp(e.target.value); clear() }}
                placeholder="6 digit OTP" type="tel" maxLength={6} autoComplete="off"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 tracking-widest font-bold text-center text-lg"/>
            </div>
            <button onClick={() => handleVerifyOtp('reset')} disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify OTP →'}
            </button>
            <button onClick={() => handleSendOtp('reset')} className="w-full mt-3 py-2 text-xs text-teal-600">Resend OTP</button>
            <button onClick={() => { setStep('form'); clear() }} className="w-full mt-1 py-2 text-xs text-gray-400">← Change number</button>
          </>
        )}

        {tab === 'reset' && step === 'newpassword' && (
          <>
            <div className="bg-teal-50 rounded-xl p-3 mb-4 text-xs text-teal-700 font-medium">✓ OTP verified. Set your new password.</div>
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">New password</label>
              <input value={newPassword} onChange={e => { setNewPassword(e.target.value); clear() }}
                placeholder="Min 6 characters" type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            </div>
            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Confirm password</label>
              <input value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); clear() }}
                placeholder="Repeat your password" type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            </div>
            <button onClick={handleReset} disabled={loading}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50">
              {loading ? 'Resetting...' : 'Reset password →'}
            </button>
          </>
        )}

        {tab === 'reset' && step === 'done' && (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">✅</div>
            <div className="font-bold text-gray-900 mb-2">Password reset!</div>
            <div className="text-sm text-gray-500 mb-6">Login with your new password.</div>
            <button onClick={() => switchTab('login')}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700">
              Go to login →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ListingCard({ listing, onProfileClick, currentUser }) {
  const [requested, setRequested] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const initials = listing.user?.name ? listing.user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '??'
  const isOwn = currentUser?.id === listing.user?.id

  const handleRequestContact = async () => {
    if (!currentUser) return
    try {
      setRequesting(true)
      await axios.post(`${API}/api/listings/${listing.id}/request-contact?requesterId=${currentUser.id}`)
      setRequested(true)
    } catch { setRequested(true) }
    finally { setRequesting(false) }
  }

  return (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-teal-50 text-teal-700">{listing.category}</span>
        <span className="text-xs text-gray-400 capitalize">{listing.type}</span>
      </div>
      <h3 className="font-bold text-gray-900 mb-1 text-sm leading-tight">{listing.title}</h3>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{listing.description}</p>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => listing.user && onProfileClick(listing.user.id)}>
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          <div>
            <div className="text-xs font-semibold text-gray-700 hover:text-teal-600">
              {listing.user?.name || 'Anonymous'}
              {listing.user?.isVerified && <span className="text-teal-500 ml-1">✓</span>}
            </div>
            <div className="text-xs text-gray-400">{listing.area}</div>
          </div>
        </div>
        <div className="text-sm font-bold text-gray-900">₹{listing.budgetMin}–{listing.budgetMax}</div>
      </div>
      {!isOwn && (
        <button onClick={handleRequestContact} disabled={requested || requesting}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${requested ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
          {requesting ? 'Sending...' : requested ? '✓ Request Sent' : '🤝 Connect'}
        </button>
      )}
    </div>
  )
}

function RequestsInbox({ currentUser, onBack }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/users/${currentUser.id}/contact-requests`)
      .then(res => setRequests(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentUser.id])

  const handleApprove = async (id) => {
    await axios.put(`${API}/api/contact-requests/${id}/approve`)
    setRequests(prev => prev.map(r => r.id === id ? {...r, status: 'approved'} : r))
  }

  const handleReject = async (id) => {
    await axios.put(`${API}/api/contact-requests/${id}/reject`)
    setRequests(prev => prev.map(r => r.id === id ? {...r, status: 'rejected'} : r))
  }

  const pending = requests.filter(r => r.status === 'pending')
  const approved = requests.filter(r => r.status === 'approved')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">←</button>
          <div className="font-bold text-gray-900">Connect Requests</div>
          {pending.length > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>}
        </div>
        <div className="px-5 pt-4">
          {loading && <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>}
          {!loading && requests.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-3">📬</div><div className="text-sm">No requests yet</div></div>}
          {pending.length > 0 && <>
            <div className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Waiting — {pending.length}</div>
            {pending.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-4 mb-3 border border-orange-200 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white text-sm font-bold">
                    {req.requester?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">{req.requester?.name}</div>
                    <div className="text-xs text-gray-500">{req.requester?.area} wants to connect</div>
                    <div className="text-xs text-gray-400 mt-0.5">About: {req.listing?.title}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(req.id)} className="flex-1 bg-teal-500 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-teal-600">✓ Approve</button>
                  <button onClick={() => handleReject(req.id)} className="bg-gray-100 text-gray-600 text-sm font-bold px-4 py-2.5 rounded-xl">✕</button>
                </div>
              </div>
            ))}
          </>}
          {approved.length > 0 && <>
            <div className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3 mt-4">Approved — {approved.length}</div>
            {approved.map(req => (
              <div key={req.id} className="bg-white rounded-2xl p-4 mb-3 border border-green-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-white text-sm font-bold">
                    {req.requester?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">{req.requester?.name}</div>
                    <div className="text-xs text-gray-400">About: {req.listing?.title}</div>
                  </div>
                  <a href={`tel:${req.requester?.phone}`} className="bg-green-50 text-green-700 text-xs font-bold px-3 py-2 rounded-xl">📞 {req.requester?.phone}</a>
                </div>
              </div>
            ))}
          </>}
        </div>
      </div>
    </div>
  )
}

function ProfilePage({ userId, currentUser, onBack, onOpenRequests, onOpenSentRequests }) {
  const [user, setUser] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/users/${userId}`),
      axios.get(`${API}/api/listings/user/${userId}`)
    ]).then(([u, l]) => { setUser(u.data); setListings(l.data) })
    .catch(console.error)
    .finally(() => setLoading(false))
  }, [userId])

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '??'
  const isOwnProfile = currentUser?.id === userId
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : ''

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-400 text-sm">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">←</button>
          <div className="font-bold text-gray-900">Profile</div>
          {isOwnProfile && (
            <div className="ml-auto flex gap-2">
              <button onClick={onOpenSentRequests} className="text-xs font-semibold bg-teal-50 text-teal-600 px-3 py-1.5 rounded-xl">🤝 Sent</button>
              <button onClick={onOpenRequests} className="text-xs font-semibold bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl">📬 Inbox</button>
            </div>
          )}
        </div>
        <div className="bg-white mx-5 mt-5 rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500 flex items-center justify-center text-white text-xl font-bold">{initials}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-gray-900 text-lg">{user?.name}</h2>
                {user?.isVerified && <span className="text-xs font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">✓</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1">{user?.area}{user?.city ? `, ${user.city}` : ''}</div>
              {joinedDate && <div className="text-xs text-gray-400 mt-1">Member since {joinedDate}</div>}
            </div>
          </div>
          {user?.bio && <div className="mt-4 pt-4 border-t border-gray-100"><p className="text-sm text-gray-600">{user.bio}</p></div>}
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
            <div className="text-center"><div className="text-xl font-black text-gray-900">{listings.length}</div><div className="text-xs text-gray-400">Listings</div></div>
            <div className="text-center"><div className="text-xl font-black text-teal-600">{listings.filter(l => l.type === 'offering').length}</div><div className="text-xs text-gray-400">Offering</div></div>
            <div className="text-center"><div className="text-xl font-black text-amber-500">{listings.filter(l => l.type === 'seeking').length}</div><div className="text-xs text-gray-400">Seeking</div></div>
          </div>
        </div>
        <div className="px-5 mt-5">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{listings.length > 0 ? `${listings.length} listings` : 'No listings yet'}</div>
          {listings.map(listing => (
            <div key={listing.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-teal-50 text-teal-700">{listing.category}</span>
                <span className="text-xs text-gray-400 capitalize">{listing.type}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">{listing.title}</h3>
              <p className="text-xs text-gray-500 mb-2">{listing.description}</p>
              <div className="text-sm font-bold text-gray-900">₹{listing.budgetMin}–{listing.budgetMax}</div>
            </div>
          ))}
        </div>
        <div className="h-8"/>
      </div>
    </div>
  )
}

function PostModal({ onClose, onSuccess, currentUser }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'Home Services', type: 'offering', area: currentUser?.area || '', city: currentUser?.city || 'Hyderabad', budgetMin: '', budgetMax: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const handle = (e) => setForm({...form, [e.target.name]: e.target.value})
  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return }
    if (!form.area.trim()) { setError('Area is required'); return }
    try {
      setLoading(true); setError(null)
      await axios.post(`${API}/api/listings`, { ...form, budgetMin: parseFloat(form.budgetMin)||0, budgetMax: parseFloat(form.budgetMax)||0, user: { id: currentUser.id } })
      onSuccess()
    } catch { setError('Failed to post.') }
    finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div><div className="text-xl font-black text-gray-900">Post a listing</div><div className="text-xs text-gray-400 mt-1">as {currentUser?.name}</div></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
        </div>
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">{error}</div>}
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">I am</label>
          <div className="flex gap-2">{['offering','seeking'].map(t => <button key={t} onClick={() => setForm({...form,type:t})} className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize ${form.type===t?'bg-gray-900 text-white':'bg-gray-100 text-gray-500'}`}>{t==='offering'?'🙋 Offering':'🤝 Seeking'}</button>)}</div>
        </div>
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Title</label><input name="title" value={form.title} onChange={handle} placeholder="e.g. Available for car cleaning today" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/></div>
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">{CATEGORIES.map(cat => <button key={cat} onClick={() => setForm({...form,category:cat})} className={`py-2 px-3 rounded-xl text-xs font-semibold text-left ${form.category===cat?'bg-teal-500 text-white':'bg-gray-50 text-gray-500'}`}>{cat}</button>)}</div>
        </div>
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Description</label><textarea name="description" value={form.description} onChange={handle} rows={3} placeholder="Describe what you can do..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 resize-none"/></div>
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Your area</label><input name="area" value={form.area} onChange={handle} placeholder="e.g. Banjara Hills" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/></div>
        <div className="mb-6"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Budget (₹)</label>
          <div className="flex gap-2">
            <input name="budgetMin" value={form.budgetMin} onChange={handle} placeholder="Min" type="number" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            <input name="budgetMax" value={form.budgetMax} onChange={handle} placeholder="Max" type="number" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
          </div>
        </div>
        <button onClick={submit} disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50">{loading?'Posting...':'Post listing →'}</button>
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
  const [viewingProfile, setViewingProfile] = useState(null)
  const [page, setPage] = useState('feed')

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
    } catch { setError('Could not load listings.') }
    finally { setLoading(false) }
  }

  const handleAuth = (user, keepLoggedIn) => {
    setCurrentUser(user)
    if (keepLoggedIn) localStorage.setItem('worbid_user', JSON.stringify(user))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('worbid_user')
  }

  const handleProfileClick = (userId) => { setViewingProfile(userId); setPage('profile') }

  const filtered = listings.filter(l => {
    const matchCat = activecat === 'All' || l.category === activecat
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  if (!currentUser) return <AuthPage onAuth={handleAuth} />
  if (page === 'requests') return <RequestsInbox currentUser={currentUser} onBack={() => setPage('feed')} />
  if (page === 'sentrequests') return <SentRequests currentUser={currentUser} onBack={() => setPage('feed')} />
  if (page === 'profile' && viewingProfile) return <ProfilePage userId={viewingProfile} currentUser={currentUser} onBack={() => setPage('feed')} onOpenRequests={() => setPage('requests')} onOpenSentRequests={() => setPage('sentrequests')} />
  if (page === 'myprofile') return <ProfilePage userId={currentUser.id} currentUser={currentUser} onBack={() => setPage('feed')} onOpenRequests={() => setPage('requests')} onOpenSentRequests={() => setPage('sentrequests')} />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="flex justify-between items-center px-5 py-4">
            <div className="text-2xl font-black text-gray-900 tracking-tight">Wor<span className="text-teal-500">bid</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage('myprofile')} className="text-xs font-semibold text-gray-600 hover:text-teal-600">Hi, {currentUser.name.split(' ')[0]}</button>
              <button onClick={() => setShowModal(true)} className="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-700">+ Post</button>
              <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">logout</button>
            </div>
          </div>
          <div className="px-5 pb-3"><input type="text" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/></div>
          <div className="flex gap-2 px-5 pb-4 overflow-x-auto">{['All',...CATEGORIES].map(cat => <button key={cat} onClick={() => setActivecat(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${activecat===cat?'bg-gray-900 text-white':'bg-gray-100 text-gray-500'}`}>{cat}</button>)}</div>
        </div>
        <div className="px-5 pt-4">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{filtered.length} listings · Hyderabad</div>
          {loading && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-3">⟳</div><div className="text-sm">Loading...</div></div>}
          {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center"><div className="text-red-600 text-sm">{error}</div><button onClick={fetchListings} className="mt-2 text-xs text-red-400 underline">Try again</button></div>}
          {!loading && !error && filtered.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-3">🔍</div><div className="text-sm">No listings found</div></div>}
          {!loading && filtered.map(listing => <ListingCard key={listing.id} listing={listing} onProfileClick={handleProfileClick} currentUser={currentUser} />)}
        </div>
      </div>
      {showModal && <PostModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchListings() }} currentUser={currentUser} />}
    </div>
  )
}

export default App
