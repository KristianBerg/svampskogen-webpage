import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Page } from '../components/Page'
import { products, type Product } from '../data/products'
import { useCart } from '../hooks/useCart'
import type { CartItem } from '../context/cartContext'
import { useProductPrices } from '../hooks/useProductPrices'
import { formatPrice } from '../lib/formatPrice'

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
  margin: 1.5rem 0;

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

const Subtotal = styled.p`
  font-size: 1rem;
  margin-bottom: 1.5rem;
`

const BackLink = styled(Link)`
  color: var(--color-text-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
  margin-top: 1.5rem;
`

interface OrderRow {
  item: CartItem
  product: Product
}

export default function CheckoutSuccessPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'sv' ? 'sv' : 'en'
  const { items, clear } = useCart()
  const [orderSnapshot] = useState(items)
  const hasCleared = useRef(false)

  useEffect(() => {
    if (!hasCleared.current) {
      hasCleared.current = true
      clear()
    }
    // Only ever runs once on mount — clearing the cart here is a one-time
    // side effect of landing on this page, not something to repeat on
    // every context update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows: OrderRow[] = orderSnapshot
    .map((item) => ({ item, product: products.find((candidate) => candidate.slug === item.slug) }))
    .filter((row): row is OrderRow => Boolean(row.product))

  const prices = useProductPrices(rows.map((row) => row.product.stripePriceId))

  const total = rows.reduce((sum, row) => {
    const price = prices[row.product.stripePriceId]
    return price ? sum + price.amount * row.item.quantity : sum
  }, 0)

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('checkout_success_heading')}</Heading>
      {rows.length > 0 && (
        <Table>
          <thead>
            <tr>
              <th>{t('cart_product_column')}</th>
              <th>{t('cart_quantity_column')}</th>
              <th>{t('cart_price_column')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ item, product }) => {
              const price = prices[product.stripePriceId]
              return (
                <tr key={product.slug}>
                  <td>{product.name[lang]}</td>
                  <td>{item.quantity}</td>
                  <td>{price ? formatPrice({ amount: price.amount * item.quantity, currency: price.currency }) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
      {rows.length > 0 && (
        <Subtotal>
          {t('cart_subtotal')}: {formatPrice({ amount: total, currency: 'sek' })}
        </Subtotal>
      )}
      <p>{t('checkout_success_body')}</p>
      <BackLink to="/store">{t('back_to_store')}</BackLink>
    </Page>
  )
}
