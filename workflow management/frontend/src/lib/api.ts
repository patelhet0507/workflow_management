const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (token) localStorage.setItem("token", token)
    else localStorage.removeItem("token")
  }

  getToken() {
    if (!this.token) this.token = localStorage.getItem("token")
    return this.token
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as Record<string, string>) }
    if (token) headers["Authorization"] = `Bearer ${token}`
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; throw new Error("Unauthorized") }
    if (!res.ok) { const err = await res.json().catch(() => ({ detail: res.statusText })); throw new Error(err.detail || "Request failed") }
    return res.json()
  }

  login(email: string, password: string) {
    return this.request<{ token: string; user: { id: number; name: string; email: string; role: string } }>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    })
  }

  getBookings() { return this.request<any[]>("/bookings") }
  getBooking(id: string) { return this.request<any>(`/bookings/${id}`) }
  createBooking(data: any) { return this.request<any>("/bookings", { method: "POST", body: JSON.stringify(data) }) }
  approveBooking(bookingId: string, data: { action: string; comment?: string }) {
    return this.request<any>(`/bookings/${bookingId}/approve`, { method: "POST", body: JSON.stringify(data) })
  }
  getBookingHistory(id: string) { return this.request<any[]>(`/bookings/${id}/history`) }
  getDashboardStats() { return this.request<{ total_bookings: number; pending_approvals: number; completed: number; rejected: number }>("/dashboard") }
  getUsers() { return this.request<any[]>("/users") }
}

export const api = new ApiClient()
