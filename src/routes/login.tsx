import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { auth, signInWithGoogle, logout } from '../services/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'

export const Route = createFileRoute('/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async () => {
    try {
      await signInWithGoogle()
      navigate({ to: '/' })
    } catch (error) {
      console.error("Login failed", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        {user ? (
          <div className="flex flex-col items-center space-y-4 text-center">
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            {user.photoURL && (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="h-20 w-20 rounded-full border-2 border-blue-100 shadow-sm" 
              />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900">{user.displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <div className="flex w-full flex-col gap-2 pt-4">
              <button 
                onClick={() => navigate({ to: '/' })}
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => logout()}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="mb-6 text-3xl font-extrabold text-gray-900">Sign In</h2>
            <p className="mb-8 text-gray-600">Access your reels and movie configurations.</p>
            <button 
              onClick={handleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                className="h-5 w-5"
              />
              Continue with Google
            </button>
          </div>
        )}
      </div>
    </div>
  )
}