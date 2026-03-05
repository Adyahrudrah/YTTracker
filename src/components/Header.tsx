import { useState, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Search, Youtube } from 'lucide-react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '#/services/firebase'
import { Input } from "@/components/ui/input"
import MobileAside from './MobileAside'

export default function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate({ to: '/search', search: { q: query } })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 items-center flex justify-center">
      <div className="container flex h-16 items-center justify-between px-4">
        
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="rounded-md p-1.5 bg-red-600 text-white">
              <Youtube className="h-5 w-5" />
            </div>
            <span className="hidden font-bold sm:inline-block tracking-tight text-xl">
              YT<span className="text-red-600">Tracker</span>
            </span>
          </Link>
        </div>

        {/* Central Search Bar */}
        <div className="flex-1 px-4 md:px-12 lg:max-w-2xl">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-red-600 transition-colors" />
            <Input
              type="search"
              placeholder="Search YouTube Channels"
              className="w-full pl-9 bg-muted/50 rounded-full focus-visible:ring-red-600"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Burger Menu Trigger */}
        <div className="flex items-center gap-2">
          <MobileAside user={user} />
        </div>
      </div>
    </header>
  )
}