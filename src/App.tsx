import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled, { css, keyframes } from 'styled-components'
import StorePage from './pages/StorePage'
import AboutPage from './pages/AboutPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import CheckoutCancelPage from './pages/CheckoutCancelPage'
import ReturnsPage from './pages/ReturnsPage'
import NotFoundPage from './pages/NotFoundPage'
import { useCart } from './hooks/useCart'
import { useStorePreview } from './hooks/useStorePreview'
import { CartIcon } from './components/icons/CartIcon'
import { SiteHeader } from './components/SiteHeader'
import { StoreGate } from './components/StoreGate'

const TopBar = styled.div`
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 10;
`

const LangSwitcher = styled.div`
  --color-text-secondary: #e4ddd0;
  --color-accent: #cfe0b8;

  display: flex;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  background: rgba(18, 20, 14, 0.35);
  backdrop-filter: blur(2px);
`

const flash = keyframes`
  0% {
    background: rgba(207, 224, 184, 0.55);
  }
  100% {
    background: rgba(18, 20, 14, 0.35);
  }
`

const CartLink = styled(Link)<{ $flash: boolean }>`
  --color-text-secondary: #e4ddd0;
  --color-accent: #cfe0b8;

  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  background: rgba(18, 20, 14, 0.35);
  backdrop-filter: blur(2px);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: color 0.2s;
  animation: ${({ $flash }) => ($flash ? css`${flash} 0.7s ease-out` : 'none')};

  &:hover {
    color: var(--color-accent);
  }
`

const LangButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  font-family: inherit;
  font-size: 1rem;
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

function AppContent() {
  const { t, i18n } = useTranslation()
  const { itemCount } = useCart()
  const storePreviewEnabled = useStorePreview()
  const [isFlashing, setIsFlashing] = useState(false)
  const previousItemCount = useRef(itemCount)

  useEffect(() => {
    if (itemCount > previousItemCount.current) {
      setIsFlashing(true)
      const timeout = setTimeout(() => setIsFlashing(false), 700)
      previousItemCount.current = itemCount
      return () => clearTimeout(timeout)
    }
    previousItemCount.current = itemCount
  }, [itemCount])

  return (
    <>
      <SiteHeader />
      <TopBar>
        {storePreviewEnabled && (
          <CartLink to="/cart" $flash={isFlashing}>
            <CartIcon />
            {t('cart_link')}
            {itemCount > 0 ? ` (${itemCount})` : ''}
          </CartLink>
        )}
        <LangSwitcher>
          <LangButton $active={i18n.language === 'sv'} onClick={() => void i18n.changeLanguage('sv')}>SV</LangButton>
          <LangButton $active={i18n.language === 'en'} onClick={() => void i18n.changeLanguage('en')}>EN</LangButton>
        </LangSwitcher>
      </TopBar>
      <Routes>
        <Route path="/" element={<AboutPage />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/store" element={<StoreGate enabled={storePreviewEnabled}><StorePage /></StoreGate>} />
        <Route path="/store/:slug" element={<StoreGate enabled={storePreviewEnabled}><ProductPage /></StoreGate>} />
        <Route path="/cart" element={<StoreGate enabled={storePreviewEnabled}><CartPage /></StoreGate>} />
        <Route path="/checkout/success" element={<StoreGate enabled={storePreviewEnabled}><CheckoutSuccessPage /></StoreGate>} />
        <Route path="/checkout/cancel" element={<StoreGate enabled={storePreviewEnabled}><CheckoutCancelPage /></StoreGate>} />
        <Route path="/returns" element={<ReturnsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
