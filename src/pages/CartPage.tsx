import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Page } from '../components/Page'
import { products, type Product } from '../data/products'
import { DEFAULT_SHIPPING_METHOD_ID, shippingMethods } from '../data/shippingMethods'
import { useCart } from '../hooks/useCart'
import { useProductPrices } from '../hooks/useProductPrices'
import { formatPrice } from '../lib/formatPrice'
import { createCheckoutSession } from '../lib/stripe'

// Pulled out of the component so the redirect (a plain function, not a
// component/hook) doesn't trip react-hooks/immutability on window.location.
function redirectTo(url: string) {
  window.location.href = url
}

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
    text-align: left;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
  }
`

const ProductCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const ProductImage = styled.img`
  width: 3.5rem;
  height: 3.5rem;
  object-fit: cover;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
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

const Total = styled.p`
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
`

const ShippingFieldset = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0 0 1rem;
`

const ShippingLegend = styled.legend`
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
`

const ShippingOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  padding: 0.35rem 0;
  cursor: pointer;
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

const TermsNotice = styled.p`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
`

const ErrorNotice = styled.p`
  font-size: 0.85rem;
  color: var(--color-accent);
  margin-bottom: 1rem;
`

const TermsLink = styled(Link)`
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1px;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

export default function CartPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'sv' ? 'sv' : 'en'
  const { items, setQuantity, removeItem } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState(false)
  const [shippingMethodId, setShippingMethodId] = useState(DEFAULT_SHIPPING_METHOD_ID)

  interface CartRow {
    item: (typeof items)[number]
    product: Product
  }

  const rows: CartRow[] = items
    .map((item) => ({ item, product: products.find((candidate) => candidate.slug === item.slug) }))
    .filter((row): row is CartRow => Boolean(row.product))

  const selectedShippingMethod =
    shippingMethods.find((method) => method.id === shippingMethodId) ?? shippingMethods[0]

  const prices = useProductPrices([
    ...rows.map((row) => row.product.stripePriceId),
    ...shippingMethods.map((method) => method.stripePriceId),
  ])

  const subtotal = rows.reduce((sum, row) => {
    const price = prices[row.product.stripePriceId]
    return price ? sum + price.amount * row.item.quantity : sum
  }, 0)

  const shippingPrice = selectedShippingMethod ? prices[selectedShippingMethod.stripePriceId] : undefined
  const total = subtotal + (shippingPrice?.amount ?? 0)

  const handleCheckout = async () => {
    if (!selectedShippingMethod) return
    setIsCheckingOut(true)
    setCheckoutError(false)
    try {
      const session = await createCheckoutSession([
        ...rows.map((row) => ({ stripePriceId: row.product.stripePriceId, quantity: row.item.quantity })),
        { stripePriceId: selectedShippingMethod.stripePriceId, quantity: 1 },
      ])
      redirectTo(session.url)
    } catch {
      setCheckoutError(true)
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
                      <ProductCell>
                        <ProductImage src={product.images[0]} alt="" />
                        <Link to={`/store/${product.slug}`}>{product.name[lang]}</Link>
                      </ProductCell>
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
          <ShippingFieldset>
            <ShippingLegend>{t('cart_shipping_heading')}</ShippingLegend>
            {shippingMethods.map((method) => {
              const price = prices[method.stripePriceId]
              return (
                <ShippingOption key={method.id}>
                  <input
                    type="radio"
                    name="shipping-method"
                    value={method.id}
                    checked={method.id === shippingMethodId}
                    onChange={() => setShippingMethodId(method.id)}
                  />
                  {method.name[lang]} — {price ? formatPrice({ amount: price.amount, currency: price.currency }) : '—'}
                </ShippingOption>
              )
            })}
          </ShippingFieldset>
          <Total>
            {t('cart_total')}: {formatPrice({ amount: total, currency: 'sek' })}
          </Total>
          <TermsNotice>
            {t('cart_terms_prefix')}
            {' '}
            <TermsLink to="/returns">{t('footer_returns_link')}</TermsLink>.
          </TermsNotice>
          {checkoutError && <ErrorNotice>{t('cart_checkout_error')}</ErrorNotice>}
          <CheckoutButton onClick={() => void handleCheckout()} disabled={isCheckingOut}>
            {t('cart_checkout')}
          </CheckoutButton>
        </>
      )}
      <BackLink to="/store">{t('back_to_store')}</BackLink>
    </Page>
  )
}
