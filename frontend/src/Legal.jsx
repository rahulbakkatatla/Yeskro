export function TermsPage({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">←</button>
          <div className="font-bold text-gray-900">Terms of Service</div>
        </div>
        <div className="px-5 py-6 prose prose-sm">
          <p className="text-xs text-gray-400 mb-4">Last updated: April 2026</p>
          <h3 className="font-bold text-gray-900 mb-2">1. Acceptance</h3>
          <p className="text-sm text-gray-600 mb-4">By using Worbid you agree to these terms. If you do not agree, do not use the platform.</p>
          <h3 className="font-bold text-gray-900 mb-2">2. What Worbid is</h3>
          <p className="text-sm text-gray-600 mb-4">Worbid is a platform that connects people locally. We do not provide services ourselves — we connect users who do.</p>
          <h3 className="font-bold text-gray-900 mb-2">3. Your responsibilities</h3>
          <p className="text-sm text-gray-600 mb-4">You are responsible for all content you post. You must not post illegal, fraudulent, offensive, or misleading content. You must be 18 or older to use Worbid.</p>
          <h3 className="font-bold text-gray-900 mb-2">4. Prohibited content</h3>
          <p className="text-sm text-gray-600 mb-4">No adult content. No illegal services. No spam. No fake listings. Violations will result in immediate account removal.</p>
          <h3 className="font-bold text-gray-900 mb-2">5. Liability</h3>
          <p className="text-sm text-gray-600 mb-4">Worbid is not responsible for transactions between users. Use your own judgment when connecting with others.</p>
          <h3 className="font-bold text-gray-900 mb-2">6. Contact</h3>
          <p className="text-sm text-gray-600 mb-4">For any issues email rahulbhaktala@gmail.com</p>
        </div>
      </div>
    </div>
  )
}

export function PrivacyPage({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">←</button>
          <div className="font-bold text-gray-900">Privacy Policy</div>
        </div>
        <div className="px-5 py-6">
          <p className="text-xs text-gray-400 mb-4">Last updated: April 2026</p>
          <h3 className="font-bold text-gray-900 mb-2">What we collect</h3>
          <p className="text-sm text-gray-600 mb-4">We collect your phone number, name, area, city, and optionally your email and bio when you register.</p>
          <h3 className="font-bold text-gray-900 mb-2">How we use it</h3>
          <p className="text-sm text-gray-600 mb-4">Your phone number is used for authentication. Your name and area are shown on your public profile and listings. Your email is used only for notifications.</p>
          <h3 className="font-bold text-gray-900 mb-2">Who sees your data</h3>
          <p className="text-sm text-gray-600 mb-4">Your phone number is only shared with users whose connect requests you approve. Your name and area are public.</p>
          <h3 className="font-bold text-gray-900 mb-2">Data deletion</h3>
          <p className="text-sm text-gray-600 mb-4">To delete your account and all data, email rahulbhaktala@gmail.com with your phone number.</p>
          <h3 className="font-bold text-gray-900 mb-2">Contact</h3>
          <p className="text-sm text-gray-600 mb-4">For privacy concerns email rahulbhaktala@gmail.com</p>
        </div>
      </div>
    </div>
  )
}
