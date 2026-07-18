import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import HomePage from './pages/HomePage'
import StorePage from './pages/StorePage'
import ProductPage from './pages/ProductPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import CheckoutCancelPage from './pages/CheckoutCancelPage'
import ReturnsPage from './pages/ReturnsPage'
import NotFoundPage from './pages/NotFoundPage'

const LangSwitcher = styled.div`
  --color-text-secondary: #e4ddd0;
  --color-accent: #cfe0b8;

  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  display: flex;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 999px;
  background: rgba(18, 20, 14, 0.35);
  backdrop-filter: blur(2px);
`

const LangButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0;
  color: ${({ $active }) => ($active ? 'var(--color-accent)' : 'var(--color-text-secondary)')};
  border-bottom: 1px solid ${({ $active }) => ($active ? 'var(--color-accent)' : 'transparent')};
  transition: color 0.2s;

  &:hover {
    color: var(--color-accent);
  }
`

export default function App() {
  const { i18n } = useTranslation()

  return (
    <BrowserRouter>
      <LangSwitcher>
        <LangButton $active={i18n.language === 'sv'} onClick={() => void i18n.changeLanguage('sv')}>SV</LangButton>
        <LangButton $active={i18n.language === 'en'} onClick={() => void i18n.changeLanguage('en')}>EN</LangButton>
      </LangSwitcher>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/store/:slug" element={<ProductPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
