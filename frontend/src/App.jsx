import { useState, useEffect } from 'react'
import axios from 'axios'
import SentRequests from './SentRequests'
import mixpanel from 'mixpanel-browser'
mixpanel.init('0b2f008d747b222dee9ae44285986d80', { debug: false, track_pageview: true, api_host: 'https://api-eu.mixpanel.com' })
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { auth } from './firebase'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { TermsPage, PrivacyPage } from './Legal'
const API = 'https://worbid.onrender.com'
const CATEGORIES = ['Home Services', 'Electronics', 'Furniture', 'Vehicles', 'Music', 'Labour', 'Tutoring', 'Driving', 'Food', 'Beauty', 'Events', 'Other']

function AuthPage({ onAuth, onLegal }) {
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
  try {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear()
      window.recaptchaVerifier = null
    }
  } catch (e) {
    window.recaptchaVerifier = null
  }
  window.recaptchaVerifier = new RecaptchaVerifier(
  auth,
  'recaptcha-container',
  { 
    size: 'invisible',
    callback: () => {},
    sitekey: '6LerTdwsAAAAAJSJ20D-fTaNQMnM4m6eEeE4Woyn'
  }
  ) 
  return window.recaptchaVerifier
  }

  const handleLogin = async () => {
    if (!phone || phone.length < 8) { setError('Enter valid 10 digit phone number'); return }
    if (!password.trim()) { setError('Enter your password'); return }
    try {
      setLoading(true); clear()
      const res = await axios.post(`${API}/api/users/login`, { phone, password })
      onAuth(res.data, keepLoggedIn)
      mixpanel.track('User Logged In', { area: res.data.area })
    } catch (err) {
      if (err.response?.status === 404) setError('Phone not registered. Create an account.')
      else if (err.response?.status === 401) setError('Wrong password. Try again.')
      else setError('Something went wrong. Try again.')
    } finally { setLoading(false) }
  }

  const handleSendOtp = async (purpose) => {
    if (!phone || phone.length < 8) { setError('Enter valid 10 digit phone number'); return }
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
      const result = await signInWithPhoneNumber(auth, phone, verifier)
      setConfirmationResult(result)
      setStep('otp')
      setSuccess('OTP sent to ' + phone)
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
        mixpanel.track('User Registered', { area: res.data.area, city: res.data.city })
        mixpanel.identify(String(res.data.id))
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
          <div className="text-3xl font-black text-gray-900 tracking-tight mb-1">Yes<span className="text-teal-500">kro</span></div>
          {tab === 'login' && (
          <div className="mt-3 bg-teal-50 rounded-xl p-3 text-xs text-teal-700 text-center leading-relaxed">
          🌍 Buy, sell, hire and offer locally.<br/>Verified people. No middlemen. Free forever.
          </div>
          )}
          {tab === 'register' && (
          <div className="mt-3 bg-teal-50 rounded-xl p-3 text-xs text-teal-700 text-center leading-relaxed">
          Your local marketplace for anything.<br/>Sell items, offer services, find help nearby. Free.
          </div>
          )}
        </div>

        <div id="recaptcha-container" key={tab}></div>

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
              <PhoneInput
                international
                defaultCountry="IN"
                value={phone}
                onChange={(value) => { setPhone(value || ''); clear() }}
                style={{
                    '--PhoneInputCountryFlag-height': '1em',
                    '--PhoneInput-color--focus': '#14b8a6'
                }}
                className="flex w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 gap-2"/>
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
              <PhoneInput
                international
                defaultCountry="IN"
                value={phone}
                onChange={(value) => { setPhone(value || ''); clear() }}
                style={{
                '--PhoneInputCountryFlag-height': '1em',
                '--PhoneInput-color--focus': '#14b8a6'
                }}
        className="flex w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 gap-2"/>
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
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Email (for notifications)</label>
              <input value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="your@email.com (optional)"
              type="email"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
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
              <PhoneInput
                international
                defaultCountry="IN"
                value={phone}
                onChange={(value) => { setPhone(value || ''); clear() }}
                style={{
                 '--PhoneInputCountryFlag-height': '1em',
                 '--PhoneInput-color--focus': '#14b8a6'
                }}
                className="flex w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 gap-2"/>
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
      <div className="text-center mt-4 text-xs text-gray-300">
          By using Yeskro you agree to our{' '}
          <button onClick={() => onLegal('terms')} className="text-teal-400 underline">Terms</button>
          {' '}and{' '}
          <button onClick={() => onLegal('privacy')} className="text-teal-400 underline">Privacy Policy</button>
        </div>
      </div>
    </div>
  )
}

function ListingCard({ listing, onProfileClick, currentUser, sentRequestsMap, setSentRequestsMap, onOpenSentRequests }) {
  const [requesting, setRequesting] = useState(false)
  const status = sentRequestsMap?.[listing.id]
  const timeAgo = (dateStr) => {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`
  return `${Math.floor(diff/604800)}w ago`
  }
  const initials = listing.user?.name ? listing.user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '??'
  const isOwn = currentUser?.id === listing.user?.id

  const handleRequestContact = async () => {
  if (!currentUser) return
  try {
    setRequesting(true)
    await axios.post(`${API}/api/listings/${listing.id}/request-contact?requesterId=${currentUser.id}`)
    setSentRequestsMap(prev => ({...prev, [listing.id]: 'pending'}))
    mixpanel.track('Connect Requested', { category: listing.category })
  } catch { setSentRequestsMap(prev => ({...prev, [listing.id]: 'pending'})) }
  finally { setRequesting(false) }
}
  return (
    <div className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold px-2 py-1 rounded-lg bg-teal-50 text-teal-700">{listing.category}</span>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-400 capitalize">{listing.type}</span>
           <span className="text-xs text-gray-300">{timeAgo(listing.createdAt)}</span>
        </div>
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
        <>
          {!status && (
            <button onClick={handleRequestContact} disabled={requesting}
            className="w-full py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-700 transition-all">
        {requesting ? 'Sending...' : '🤝 Connect'}
      </button>
       )}
      {status === 'pending' && (
        <button disabled
        className="w-full py-2.5 rounded-xl text-sm font-bold bg-orange-50 text-orange-500 border border-orange-200 cursor-not-allowed">
        ⏳ Request Pending
      </button>
      )}
      {status === 'approved' && (
      <button onClick={onOpenSentRequests}
        className="w-full py-2.5 rounded-xl text-sm font-bold bg-green-50 text-green-600 border border-green-200 hover:bg-green-100">
        📞 View Contact Number
      </button>
     )}
      {status === 'rejected' && (
      <button disabled
        className="w-full py-2.5 rounded-xl text-sm font-bold bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed">
        Request Declined
      </button>
     )}
    </>
   )}
   <div className="mt-2 flex justify-between items-center">
     <button onClick={() => {
       const text = `${listing.title} — ${listing.area}, ${listing.city}\n₹${listing.budgetMin}–${listing.budgetMax}\nFind this on Yeskro: Yeskro.in`
       if (navigator.share) {
         navigator.share({ title: listing.title, text })
       } else {
         navigator.clipboard.writeText(text)
         alert('Copied to clipboard!')
       }
     }} className="text-xs text-gray-400 hover:text-teal-600">🔗 Share</button>
     {!isOwn && (
       <button onClick={() => window.open(`mailto:rahulbhaktala@gmail.com?subject=Report Listing&body=Listing ID: ${listing.id}%0ATitle: ${listing.title}%0APosted by: ${listing.user?.name}%0AReason: `)}
         className="text-xs text-gray-300 hover:text-red-400">🚩 Report</button>
     )}
   </div>
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
function EditListingModal({ listing, onClose, onSave }) {
  const [form, setForm] = useState({
    title: listing.title || '',
    description: listing.description || '',
    category: listing.category || 'Other',
    type: listing.type || 'offering',
    area: listing.area || '',
    city: listing.city || '',
    budgetMin: listing.budgetMin || '',
    budgetMax: listing.budgetMax || ''
  })
  const [loading, setLoading] = useState(false)
  const handle = (e) => setForm({...form, [e.target.name]: e.target.value})

  const save = async () => {
    try {
      setLoading(true)
      const res = await axios.put(`${API}/api/listings/${listing.id}`, {
        ...form,
        budgetMin: parseFloat(form.budgetMin) || 0,
        budgetMax: parseFloat(form.budgetMax) || 0
      })
      onSave(res.data)
    } catch { alert('Failed to update') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-black text-gray-900">Edit listing</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
        </div>
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Title</label>
          <input name="title" value={form.title} onChange={handle} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/></div>
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Description</label>
          <textarea name="description" value={form.description} onChange={handle} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 resize-none"/></div>
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Category</label>
          <select name="category" value={form.category} onChange={handle} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Type</label>
          <div className="flex gap-2">{['offering','seeking'].map(t => <button key={t} onClick={() => setForm({...form,type:t})} className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize ${form.type===t?'bg-gray-900 text-white':'bg-gray-100 text-gray-500'}`}>{t}</button>)}</div></div>
        <div className="mb-4"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Area</label>
          <input name="area" value={form.area} onChange={handle} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/></div>
        <div className="mb-6"><label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Budget (₹)</label>
          <div className="flex gap-2">
            <input name="budgetMin" value={form.budgetMin} onChange={handle} placeholder="Min" type="number" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            <input name="budgetMax" value={form.budgetMax} onChange={handle} placeholder="Max" type="number" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
          </div></div>
        <button onClick={save} disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save changes →'}
        </button>
      </div>
    </div>
  )
}

function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user.name || '',
    area: user.area || '',
    city: user.city || '',
    bio: user.bio || '',
    email: user.email || ''
  })
  const [loading, setLoading] = useState(false)
  const handle = (e) => setForm({...form, [e.target.name]: e.target.value})

  const save = async () => {
    try {
      setLoading(true)
      const res = await axios.put(`${API}/api/users/profile`, { ...user, ...form })
      onSave(res.data)
    } catch { alert('Failed to update profile') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-black text-gray-900">Edit profile</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
        </div>
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Full name</label>
          <input name="name" value={form.name} onChange={handle} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
        </div>
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Area</label>
          <input name="area" value={form.area} onChange={handle} placeholder="e.g. Banjara Hills" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
        </div>
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">City</label>
          <input name="city" value={form.city} onChange={handle} placeholder="e.g. Hyderabad" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
        </div>
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Bio</label>
          <textarea name="bio" value={form.bio} onChange={handle} rows={3} placeholder="Tell people what you can do..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400 resize-none"/>
        </div>
        <div className="mb-6">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Email (for notifications)</label>
          <input name="email" value={form.email} onChange={handle} placeholder="your@email.com" type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
        </div>
        <button onClick={save} disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700 disabled:opacity-50">
          {loading ? 'Saving...' : 'Save profile →'}
        </button>
      </div>
    </div>
  )
}

function ProfilePage({ userId, currentUser, onBack, onOpenRequests, onOpenSentRequests, onLogout }) {
  const [user, setUser] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingListing, setEditingListing] = useState(null)
  const [editingProfile, setEditingProfile] = useState(false)

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
            <button onClick={() => setEditingProfile(true)} className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl">✏️ Edit</button>
            <button onClick={onOpenSentRequests} className="text-xs font-semibold bg-teal-50 text-teal-600 px-3 py-1.5 rounded-xl">🤝 Sent</button>
            <button onClick={onOpenRequests} className="text-xs font-semibold bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl">📬 Inbox</button>
            <button onClick={onLogout} className="text-xs font-semibold bg-red-50 text-red-500 px-3 py-1.5 rounded-xl">Logout</button>
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
    <div className="flex justify-between items-center mt-2">
      <div className="text-sm font-bold text-gray-900">₹{listing.budgetMin}–{listing.budgetMax}</div>
      {isOwnProfile && (
        <div className="flex gap-2">
          <button onClick={() => setEditingListing(listing)}
            className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-xl hover:bg-teal-100">
            ✏️ Edit
          </button>
          <button onClick={async () => {
            if (window.confirm('Delete this listing?')) {
              await axios.delete(`${API}/api/listings/${listing.id}`)
              setListings(prev => prev.filter(l => l.id !== listing.id))
            }
          }} className="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-xl hover:bg-red-100">
            🗑️ Delete
          </button>
          <button onClick={async () => {
            await axios.put(`${API}/api/listings/${listing.id}/close`)
            setListings(prev => prev.map(l => l.id === listing.id ? {...l, isActive: false} : l))
          }} className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl hover:bg-gray-100">
            ✓ Done
          </button>
        </div>
      )}
    </div>
    {listing.isActive === false && (
      <div className="mt-2 text-xs text-gray-400 font-medium">✓ Marked as fulfilled</div>
    )}
  </div>
))}
        </div>
        {editingListing && (
          <EditListingModal
            listing={editingListing}
            onClose={() => setEditingListing(null)}
            onSave={(updated) => {
              setListings(prev => prev.map(l => l.id === updated.id ? updated : l))
              setEditingListing(null)
            }}
          />
        )}
        {editingProfile && user && (
          <EditProfileModal
            user={user}
            onClose={() => setEditingProfile(false)}
            onSave={(updated) => {
            setUser(updated)
            setEditingProfile(false)
            // Update localStorage if this is the current user
            const saved = localStorage.getItem('Yeskro_user')
            if (saved) {
               const localUser = JSON.parse(saved)
              if (localUser.id === updated.id) {
                localStorage.setItem('Yeskro_user', JSON.stringify(updated))
              }
            }
        }}
          />
        )}
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
      mixpanel.track('Listing Posted', { category: form.category, type: form.type })
      onSuccess('Listing posted successfully! 🎉')
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

function FilterModal({ filters, setFilters, onClose, onReset }) {
  const [local, setLocal] = useState(filters)
  const handle = (key, value) => setLocal(prev => ({...prev, [key]: value}))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="text-xl font-black text-gray-900">Filters</div>
          <div className="flex gap-2">
            <button onClick={() => { onReset(); onClose() }} className="text-xs text-gray-400 hover:text-red-500 font-medium">Reset all</button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">✕</button>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">City</label>
          <input value={local.city} onChange={e => handle('city', e.target.value)}
            placeholder="e.g. Mumbai, Hyderabad, Delhi"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Area</label>
          <input value={local.area} onChange={e => handle('area', e.target.value)}
            placeholder="e.g. Banjara Hills, Andheri"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Type</label>
          <div className="flex gap-2">
            {[['all', 'All'], ['offering', '🙋 Offering'], ['seeking', '🤝 Seeking']].map(([val, label]) => (
              <button key={val} onClick={() => handle('type', val)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${local.type === val ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Budget Range (₹)</label>
          <div className="flex gap-2">
            <input value={local.minBudget} onChange={e => handle('minBudget', e.target.value)}
              placeholder="Min" type="number"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            <input value={local.maxBudget} onChange={e => handle('maxBudget', e.target.value)}
              placeholder="Max" type="number"
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Posted</label>
          <div className="flex gap-2">
            {[['all', 'Any time'], ['today', 'Today'], ['week', 'This week'], ['month', 'This month']].map(([val, label]) => (
              <button key={val} onClick={() => handle('timeRange', val)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold ${local.timeRange === val ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-2">Sort by</label>
          <div className="flex gap-2">
            {[['newest', 'Newest'], ['price_low', 'Price ↑'], ['price_high', 'Price ↓']].map(([val, label]) => (
              <button key={val} onClick={() => handle('sortBy', val)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${local.sortBy === val ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <label className="text-sm font-semibold text-gray-700">Verified users only</label>
            <input type="checkbox" checked={local.verifiedOnly} onChange={e => handle('verifiedOnly', e.target.checked)}
              className="w-5 h-5 accent-teal-500"/>
          </div>
        </div>

        <button onClick={() => { setFilters(local); onClose() }}
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-700">
          Apply Filters →
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
  const [cityFilter, setCityFilter] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [viewingProfile, setViewingProfile] = useState(null)
  const [page, setPage] = useState('feed')
  const [successMsg, setSuccessMsg] = useState(null)
  const [sentRequestsMap, setSentRequestsMap] = useState({})
  const [inboxCount, setInboxCount] = useState(0)
  const [legalPage, setLegalPage] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
  city: '',
  area: '',
  type: 'all',
  minBudget: '',
  maxBudget: '',
  timeRange: 'all',
  sortBy: 'newest',
  verifiedOnly: false
  })

  useEffect(() => {
    const saved = localStorage.getItem('Yeskro_user')
    if (saved) {
      const user = JSON.parse(saved)
      setCurrentUser(user)
      fetchSentRequests(user.id)
      fetchInboxCount(user.id)
  }
  fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API}/api/listings`)
      setListings(res.data.filter(l => l.isActive !== false))
      setError(null)
    } catch { setError('Could not load listings.') }
    finally { setLoading(false) }
  }

  const fetchSentRequests = async (userId) => {
  try {
    const res = await axios.get(`${API}/api/users/${userId}/my-requests`)
    const map = {}
    res.data.forEach(req => {
      map[req.listing?.id] = req.status
    })
    setSentRequestsMap(map)
    } catch { }
  }

  const fetchInboxCount = async (userId) => {
  try {
    const res = await axios.get(`${API}/api/users/${userId}/contact-requests`)
    setInboxCount(res.data.filter(r => r.status === 'pending').length)
  } catch { }
  }

  const handleAuth = (user, keepLoggedIn) => {
  setCurrentUser(user)
  if (keepLoggedIn) localStorage.setItem('Yeskro_user', JSON.stringify(user))
  fetchSentRequests(user.id)
  fetchInboxCount(user.id)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('Yeskro_user')
  }

  const handleProfileClick = (userId) => { setViewingProfile(userId); setPage('profile') }

  const filtered = listings.filter(l => {
  const matchCat = activecat === 'All' || l.category === activecat
  const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.description?.toLowerCase().includes(search.toLowerCase()) ||
    l.area?.toLowerCase().includes(search.toLowerCase()) ||
    l.city?.toLowerCase().includes(search.toLowerCase()) ||
    l.user?.name?.toLowerCase().includes(search.toLowerCase())
  const matchCity = filters.city ? 
    l.city?.toLowerCase().includes(filters.city.toLowerCase()) || 
    l.area?.toLowerCase().includes(filters.city.toLowerCase()) :
    !cityFilter || !currentUser?.city || l.city?.toLowerCase() === currentUser?.city?.toLowerCase()
  const matchArea = !filters.area || l.area?.toLowerCase().includes(filters.area.toLowerCase())
  const matchType = filters.type === 'all' || l.type === filters.type
  const matchMinBudget = !filters.minBudget || l.budgetMax >= parseFloat(filters.minBudget)
  const matchMaxBudget = !filters.maxBudget || l.budgetMin <= parseFloat(filters.maxBudget)
  const matchVerified = !filters.verifiedOnly || l.user?.isVerified
  const matchTime = filters.timeRange === 'all' || (() => {
    const days = filters.timeRange === 'today' ? 1 : filters.timeRange === 'week' ? 7 : 30
    return new Date(l.createdAt) > new Date(Date.now() - days * 86400000)
  })()
  return matchCat && matchSearch && matchCity && matchArea && matchType && matchMinBudget && matchMaxBudget && matchVerified && matchTime
}).sort((a, b) => {
  if (filters.sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
  if (filters.sortBy === 'price_low') return a.budgetMin - b.budgetMin
  if (filters.sortBy === 'price_high') return b.budgetMin - a.budgetMin
  return 0
})
  if (legalPage === 'terms') return <TermsPage onBack={() => setLegalPage(null)} />
  if (legalPage === 'privacy') return <PrivacyPage onBack={() => setLegalPage(null)} />
  if (!currentUser) return <AuthPage onAuth={handleAuth} onLegal={setLegalPage} />
  if (page === 'requests') return <RequestsInbox currentUser={currentUser} onBack={() => setPage('feed')} />
  if (page === 'sentrequests') return <SentRequests currentUser={currentUser} onBack={() => setPage('feed')} />
  if (page === 'profile' && viewingProfile) return <ProfilePage userId={viewingProfile} currentUser={currentUser} onBack={() => setPage('feed')} onOpenRequests={() => setPage('requests')} onOpenSentRequests={() => setPage('sentrequests')} onLogout={handleLogout} />
  if (page === 'myprofile') return <ProfilePage userId={currentUser.id} currentUser={currentUser} onBack={() => setPage('feed')} onOpenRequests={() => setPage('requests')} onOpenSentRequests={() => setPage('sentrequests')} onLogout={handleLogout}  />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="flex justify-between items-center px-5 py-4">
            <div className="text-2xl font-black text-gray-900 tracking-tight">Yes<span className="text-teal-500">kro</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage('myprofile')} className="text-xs font-semibold text-gray-600 hover:text-teal-600">Hi, {currentUser.name.split(' ')[0]}</button>
              <button onClick={() => setPage('requests')} className="relative p-1">
                <span className="text-lg">🔔</span>
                 {inboxCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {inboxCount}
                </span>
              )}
              </button>
            <button onClick={() => setShowModal(true)} className="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-700">+ Post</button>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">logout</button>
            </div>
          </div>
          <div className="px-5 pb-3 flex gap-2">
            <input type="text" placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-400"/>
            <button onClick={() => setShowFilters(true)} className={`px-4 py-3 rounded-xl text-sm font-bold border ${Object.values(filters).some(v => v && v !== 'all' && v !== 'newest' && v !== false) ? 'bg-teal-500 text-white border-teal-500' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              ⚙️
            </button>
            </div>          <div className="flex gap-2 px-5 pb-4 overflow-x-auto">{['All',...CATEGORIES].map(cat => <button key={cat} onClick={() => setActivecat(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${activecat===cat?'bg-gray-900 text-white':'bg-gray-100 text-gray-500'}`}>{cat}</button>)}</div>
        </div>
        <div className="px-5 pt-4">
          {successMsg && (
           <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4 text-sm text-green-700 font-medium flex justify-between items-center">
             {successMsg}
            <button onClick={() => setSuccessMsg(null)} className="text-green-400 font-bold">✕</button>
          </div>
          )}
          <div className="flex justify-between items-center mb-3">
         <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{filtered.length} listings · {currentUser?.city || 'All'}</div>
            <button onClick={() => setCityFilter(!cityFilter)} className={`text-xs font-semibold px-3 py-1 rounded-full ${cityFilter ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {cityFilter ? '📍 My City' : '🌍 All Cities'}
            </button>
          </div>
          {loading && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-3">⟳</div><div className="text-sm">Loading...</div></div>}
          {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center"><div className="text-red-600 text-sm">{error}</div><button onClick={fetchListings} className="mt-2 text-xs text-red-400 underline">Try again</button></div>}
          {!loading && !error && filtered.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-3xl mb-3">🔍</div><div className="text-sm">No listings found</div></div>}
          {!loading && filtered.map(listing => <ListingCard key={listing.id} listing={listing} onProfileClick={handleProfileClick} currentUser={currentUser} sentRequestsMap={sentRequestsMap} setSentRequestsMap={setSentRequestsMap} onOpenSentRequests={() => setPage('sentrequests')} />)}
        </div>
      </div>
        {showModal && <PostModal onClose={() => setShowModal(false)} onSuccess={(msg) => { setShowModal(false); fetchListings(); setSuccessMsg(msg) }} currentUser={currentUser} />}
        {showFilters && <FilterModal filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} onReset={() => setFilters({ city: '', area: '', type: 'all', minBudget: '', maxBudget: '', timeRange: 'all', sortBy: 'newest', verifiedOnly: false })} />}
    </div>
  )
}

export default App
