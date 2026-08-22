import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Join from '../pages/Join'
import Summary from '../pages/Summary'
import Donate from '../pages/Donate'

// ── Mock the API module ────────────────────────────────────
vi.mock('../utils/api', () => ({
  createGroup: vi.fn(),
  getGroupByOwner: vi.fn(),
  getGroupByJoinToken: vi.fn(),
  getMemberByToken: vi.fn(),
  getMySelections: vi.fn(),
  upsertSelection: vi.fn(),
  getSummary: vi.fn(),
  addMember: vi.fn(),
  addMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
  updateTip: vi.fn(),
  closeGroup: vi.fn(),
}))

import * as api from '../utils/api'

function renderWithRouter(ui, { path = '/', route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>
  )
}

// ═══════════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════════
describe('Home page', () => {
  it('renders the headline and form', () => {
    renderWithRouter(<Home />, { path: '/' })
    expect(screen.getByText(/split bills with/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/dinner at mario/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create group/i })).toBeInTheDocument()
  })

  it('submit button is disabled when name is empty', () => {
    renderWithRouter(<Home />, { path: '/' })
    const btn = screen.getByRole('button', { name: /create group/i })
    expect(btn).toBeDisabled()
  })

  it('enables submit button when name is typed', () => {
    renderWithRouter(<Home />, { path: '/' })
    const input = screen.getByPlaceholderText(/dinner at mario/i)
    fireEvent.change(input, { target: { value: "Luigi's" } })
    expect(screen.getByRole('button', { name: /create group/i })).toBeEnabled()
  })

  it('calls createGroup with correct args on submit', async () => {
    api.createGroup.mockResolvedValue({ owner_token: 'tok123' })
    renderWithRouter(<Home />, { path: '/' })
    fireEvent.change(screen.getByPlaceholderText(/dinner at mario/i), { target: { value: "Test Dinner" } })
    fireEvent.click(screen.getByRole('button', { name: /create group/i }))
    await waitFor(() => expect(api.createGroup).toHaveBeenCalledWith('Test Dinner', 15))
  })

  it('shows error when createGroup throws', async () => {
    api.createGroup.mockRejectedValue(new Error('Server error'))
    renderWithRouter(<Home />, { path: '/' })
    fireEvent.change(screen.getByPlaceholderText(/dinner at mario/i), { target: { value: "Test" } })
    fireEvent.click(screen.getByRole('button', { name: /create group/i }))
    await waitFor(() => expect(screen.getByText('Server error')).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════
// JOIN PAGE
// ═══════════════════════════════════════════════════════════
describe('Join page', () => {
  const mockGroup = {
    id: 1,
    name: "Mario's Dinner",
    tip_percentage: 10,
    is_closed: false,
    menu_items: [
      { id: 10, name: 'Pizza', price: 12.0 },
      { id: 11, name: 'Wine', price: 8.0 },
    ],
  }
  const mockMember = { id: 1, name: 'Alice', join_token: 'alice-tok' }

  beforeEach(() => {
    api.getGroupByJoinToken.mockResolvedValue(mockGroup)
    api.getMemberByToken.mockResolvedValue(mockMember)
    api.getMySelections.mockResolvedValue([])
    api.upsertSelection.mockResolvedValue({ id: 1, member_id: 1, menu_item_id: 10, quantity: 1 })
  })

  it('renders the group name and member greeting', async () => {
    renderWithRouter(<Join />, { path: '/join/:joinToken', route: '/join/alice-tok' })
    await waitFor(() => expect(screen.getByText("Mario's Dinner")).toBeInTheDocument())
    expect(screen.getByText(/hey alice/i)).toBeInTheDocument()
  })

  it('renders all menu items', async () => {
    renderWithRouter(<Join />, { path: '/join/:joinToken', route: '/join/alice-tok' })
    await waitFor(() => expect(screen.getByText('Pizza')).toBeInTheDocument())
    expect(screen.getByText('Wine')).toBeInTheDocument()
  })

  it('shows correct initial subtotal of $0', async () => {
    renderWithRouter(<Join />, { path: '/join/:joinToken', route: '/join/alice-tok' })
    await waitFor(() => expect(screen.getByText(''0,00€',00€')).toBeInTheDocument())
  })

  it('calls upsertSelection when + is clicked', async () => {
    renderWithRouter(<Join />, { path: '/join/:joinToken', route: '/join/alice-tok' })
    await waitFor(() => screen.getAllByRole('button', { name: '+' }))
    fireEvent.click(screen.getAllByRole('button', { name: '+' })[0])
    await waitFor(() => expect(api.upsertSelection).toHaveBeenCalledWith('alice-tok', 10, 1))
  })

  it('shows closed banner when group is closed', async () => {
    api.getGroupByJoinToken.mockResolvedValue({ ...mockGroup, is_closed: true })
    renderWithRouter(<Join />, { path: '/join/:joinToken', route: '/join/alice-tok' })
    await waitFor(() => expect(screen.getByText(/closed/i)).toBeInTheDocument())
  })

  it('shows error page on bad token', async () => {
    api.getGroupByJoinToken.mockRejectedValue(new Error('Not found'))
    renderWithRouter(<Join />, { path: '/join/:joinToken', route: '/join/bad-tok' })
    await waitFor(() => expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════
// SUMMARY PAGE
// ═══════════════════════════════════════════════════════════
describe('Summary page', () => {
  const mockSummary = {
    group_name: "Mario's Dinner",
    tip_percentage: 10,
    grand_total: 44.0,
    members: [
      {
        member_id: 1,
        member_name: 'Alice',
        subtotal: 40.0,
        tip_amount: 4.0,
        total: 44.0,
        items: [{ name: 'Pizza', unit_price: 20, quantity: 2, line_total: 40 }],
      },
    ],
  }

  beforeEach(() => {
    api.getSummary.mockResolvedValue(mockSummary)
  })

  it('renders grand total', async () => {
    renderWithRouter(<Summary />, { path: '/summary/:ownerToken', route: '/summary/tok123' })
    await waitFor(() => expect(screen.getByText('44,00€')).toBeInTheDocument())
  })

  it('renders member name and their total', async () => {
    renderWithRouter(<Summary />, { path: '/summary/:ownerToken', route: '/summary/tok123' })
    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument())
    // The member badge also shows 44,00€
    const amounts = screen.getAllByText('44,00€')
    expect(amounts.length).toBeGreaterThanOrEqual(1)
  })

  it('renders item breakdown', async () => {
    renderWithRouter(<Summary />, { path: '/summary/:ownerToken', route: '/summary/tok123' })
    await waitFor(() => expect(screen.getByText('Pizza')).toBeInTheDocument())
    expect(screen.getByText('40,00€')).toBeInTheDocument()
  })

  it('shows error when summary fetch fails', async () => {
    api.getSummary.mockRejectedValue(new Error('fail'))
    renderWithRouter(<Summary />, { path: '/summary/:ownerToken', route: '/summary/tok123' })
    await waitFor(() => expect(screen.getByText(/could not load/i)).toBeInTheDocument())
  })
})

// ═══════════════════════════════════════════════════════════
// DONATE PAGE
// ═══════════════════════════════════════════════════════════
describe('Donate page', () => {
  it('renders both organization names', () => {
    renderWithRouter(<Donate />, { path: '/donate' })
    expect(screen.getByText('Feeding America')).toBeInTheDocument()
    expect(screen.getByText('No Kid Hungry')).toBeInTheDocument()
  })

  it('donate buttons are disabled until an amount is selected', () => {
    renderWithRouter(<Donate />, { path: '/donate' })
    const donateButtons = screen.getAllByRole('button', { name: /donate/i })
    donateButtons.forEach(btn => expect(btn).toBeDisabled())
  })

  it('enables donate button after selecting a preset amount', () => {
    renderWithRouter(<Donate />, { path: '/donate' })
    const fiveButtons = screen.getAllByRole('button', { name: '5€' })
    fireEvent.click(fiveButtons[0])
    const donateButtons = screen.getAllByRole('button', { name: /donate \5€/i })
    expect(donateButtons[0]).toBeEnabled()
  })

  it('shows copy link buttons', () => {
    renderWithRouter(<Donate />, { path: '/donate' })
    expect(screen.getAllByRole('button', { name: /copy link/i }).length).toBe(2)
  })

  it('renders disclaimer about no affiliation', () => {
    renderWithRouter(<Donate />, { path: '/donate' })
    expect(screen.getByText(/no affiliation/i)).toBeInTheDocument()
  })
})
