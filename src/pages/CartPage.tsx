import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Page } from '../components/Page'
import { products, type Product } from '../data/products'
import { useCart } from '../hooks/useCart'
import { useProductPrices } from '../hooks/useProductPrices'
import { formatPrice } from '../lib/formatPrice'
import { createCheckoutSession } from '../lib/stripe'

const Heading = styled.h1`
  font-size: 1.4rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
`

const Table = styled.table`
  width: min(560px, 90vw);
  border-collapse: collapse;
  margin-bottom: 1.5rem;

  th {
    text-align: left;
    font-weight: normal;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  td {
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-border);
  }
`

const QuantityInput = styled.input`
  width: 3.5rem;
  font-family: inherit;
  font-size: 0.9rem;
  padding: 0.4rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
`

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: var(--color-text-secondary);
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;

  &:hover {
    color: var(--color-accent);
  }
`

const Subtotal = styled.p`
  font-size: 1rem;
  margin-bottom: 1.5rem;
`

const CheckoutButton = styled.button`
  font-family: inherit;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.75rem 2rem;
  border: 1px solid var(--color-text-primary);
  background: var(--color-text-primary);
  color: var(--color-background);
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const BackLink = styled(Link)`
  color: var(--color-text-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
  margin-top: 1.5rem;
`

export default function CartPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'sv' ? 'sv' : 'en'
  const { items, setQuantity, removeItem } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  interface CartRow {
    item: (typeof items)[number]
    product: Product
  }

  const rows: CartRow[] = items
    .map((item) => ({ item, product: products.find((candidate) => candidate.slug === item.slug) }))
    .filter((row): row is CartRow => Boolean(row.product))

  const prices = useProductPrices(rows.map((row) => row.product.stripePriceId))

  const subtotal = rows.reduce((sum, row) => {
    const price = prices[row.product.stripePriceId]
    return price ? sum + price.amount * row.item.quantity : sum
  }, 0)

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    try {
      const session = await createCheckoutSession(
        rows.map((row) => ({ stripePriceId: row.product.stripePriceId, quantity: row.item.quantity })),
      )
      window.location.href = session.url
    } finally {
      setIsCheckingOut(false)
    }
  }

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('cart_heading')}</Heading>
      {rows.length === 0 ? (
        <p>{t('cart_empty')}</p>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <th>{t('cart_product_column')}</th>
                <th>{t('cart_quantity_column')}</th>
                <th>{t('cart_price_column')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ item, product }) => {
                const price = prices[product.stripePriceId]
                return (
                  <tr key={product.slug}>
                    <td>
                      <Link to={`/store/${product.slug}`}>{product.name[lang]}</Link>
                    </td>
                    <td>
                      <QuantityInput
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => setQuantity(product.slug, Number(event.target.value))}
                      />
                    </td>
                    <td>{price ? formatPrice({ amount: price.amount * item.quantity, currency: price.currency }) : '—'}</td>
                    <td>
                      <RemoveButton onClick={() => removeItem(product.slug)}>{t('cart_remove')}</RemoveButton>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
          <Subtotal>
            {t('cart_subtotal')}: {formatPrice({ amount: subtotal, currency: 'sek' })}
          </Subtotal>
          <CheckoutButton onClick={() => void handleCheckout()} disabled={isCheckingOut}>
            {t('cart_checkout')}
          </CheckoutButton>
        </>
      )}
      <BackLink to="/store">{t('back_to_store')}</BackLink>
    </Page>
  )
}
