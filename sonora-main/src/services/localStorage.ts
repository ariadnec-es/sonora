type StorageKey =
  | 'sonora_events'
  | 'sonora_music'
  | 'sonora_folders'
  | 'sonora_settings'
  | 'loggedUser'

export function loadFromStorage<T>(key: StorageKey, fallback: T): T {
  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch (error) {
    console.error(`Falha ao carregar ${key}`, error)
    return fallback
  }
}

export function saveToStorage<T>(key: StorageKey, value: T) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function removeFromStorage(key: StorageKey) {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(key)
}
