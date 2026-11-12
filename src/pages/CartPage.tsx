import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Page } from '../components/Page'
import { products, type Product } from '../data/products'
import { shippingMethod } from '../data/shippingMethods'
import { cartItemKey } from '../context/cartContext'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../lib/formatPrice'
import { getProductImages } from '../lib/productImages'
import { lineItemName } from '../lib/productVariants'
import { createCheckoutSession } from '../lib/stripe'
import { usePageTitle } from '../hooks/usePageTitle'

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

  /* On phones each item takes two rows: picture and name, then quantity, price and remove. */
  @media (max-width: 600px) {
    display: block;

    thead {
      display: none;
    }

    tbody {
      display: block;
    }

    tr {
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-template-areas:
        'product product product'
        'quantity price remove';
      align-items: center;
      column-gap: 1rem;
      row-gap: 0.75rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--color-border);
    }

    td {
      padding: 0;
      border-bottom: none;
    }

    td:nth-child(1) {
      grid-area: product;
    }

    td:nth-child(2) {
      grid-area: quantity;
    }

    td:nth-child(3) {
      grid-area: price;
    }

    td:nth-child(4) {
      grid-area: remove;
    }
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

const DeliveryTime = styled.p`
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
`

const DeliveryFieldset = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0 0 1.5rem;
  max-width: min(560px, 90vw);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;

  legend {
    font-size: 1rem;
    padding: 0;
    margin-bottom: 0.5rem;
  }

  /* Top-aligned so a wrapped option keeps its radio button level with the first line. */
  label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    cursor: pointer;
  }

  input {
    flex-shrink: 0;
    margin-top: 0.2em;
    accent-color: var(--color-text-primary);
  }
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

const ProductLink = styled(Link)`
  color: var(--color-text-primary);
  text-decoration: none;

  &:hover {
    color: var(--color-accent);
  }
`

const TermsNotice = styled.p`
  width: min(560px, 90vw);
  font-size: 0.8rem;
  line-height: 1.6;
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
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1px;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

export default function CartPage() {
  const { t, i18n } = useTranslation()
  usePageTitle(t('cart_heading'))
  const lang = i18n.resolvedLanguage === 'sv' ? 'sv' : 'en'
  const { items, setQuantity, removeItem, deliveryMethod, setDeliveryMethod } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState(false)

  interface CartRow {
    item: (typeof items)[number]
    product: Product
  }

  const rows: CartRow[] = items
    .map((item) => ({ item, product: products.find((candidate) => candidate.slug === item.slug) }))
    .filter((row): row is CartRow => Boolean(row.product))

  const subtotal = rows.reduce((sum, row) => sum + row.product.priceOre * row.item.quantity, 0)
  const deliveryPriceOre = deliveryMethod === 'pickup' ? 0 : shippingMethod.priceOre
  const total = subtotal + deliveryPriceOre

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    setCheckoutError(false)
    try {
      const session = await createCheckoutSession(
        rows.map((row) => ({ slug: row.product.slug, quantity: row.item.quantity, variants: row.item.variants })),
        lang,
        deliveryMethod,
      )
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
              {rows.map(({ item, product }) => (
                <tr key={cartItemKey(item)}>
                  <td>
                    <ProductCell>
                      <ProductImage src={getProductImages(product)[0].thumb} alt="" loading="lazy" />
                      <ProductLink to={`/store/${product.slug}`}>{lineItemName(product, item.variants, lang)}</ProductLink>
                    </ProductCell>
                  </td>
                  <td>
                    <QuantityInput
                      type="number"
                      aria-label={t('cart_quantity_column')}
                      min={1}
                      value={item.quantity}
                      onChange={(event) => setQuantity(cartItemKey(item), Number(event.target.value))}
                    />
                  </td>
                  <td>{formatPrice(product.priceOre * item.quantity)}</td>
                  <td>
                    <RemoveButton onClick={() => removeItem(cartItemKey(item))}>{t('cart_remove')}</RemoveButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Subtotal>
            {t('cart_subtotal')}: {formatPrice(subtotal)}
          </Subtotal>
          <DeliveryFieldset>
            <legend>{t('cart_delivery_heading')}</legend>
            <label>
              <input
                type="radio"
                name="delivery"
                checked={deliveryMethod === 'shipping'}
                onChange={() => setDeliveryMethod('shipping')}
              />
              {shippingMethod.name[lang]}: {formatPrice(shippingMethod.priceOre)}
            </label>
            <label>
              <input
                type="radio"
                name="delivery"
                checked={deliveryMethod === 'pickup'}
                onChange={() => setDeliveryMethod('pickup')}
              />
              {t('cart_pickup_option')}: {formatPrice(0)}
            </label>
          </DeliveryFieldset>
          {deliveryMethod === 'shipping' && <DeliveryTime>{t('cart_delivery_time')}</DeliveryTime>}
          <Total>
            {t('cart_total')}: {formatPrice(total)}
          </Total>
          <TermsNotice>
            {t('cart_terms_prefix')}
            {' '}
            <TermsLink to="/returns">{t('footer_returns_link')}</TermsLink>.
            {' '}
            {t('cart_withdraw_prefix')}
            {' '}
            <TermsLink to="/withdraw">{t('withdraw_link')}</TermsLink>
            {t('cart_withdraw_suffix')}
            {' '}
            {t('cart_privacy_prefix')}
            {' '}
            <TermsLink to="/privacy">{t('footer_privacy_link')}</TermsLink>.
          </TermsNotice>
          {checkoutError && <ErrorNotice>{t('cart_checkout_error')}</ErrorNotice>}
          <CheckoutButton onClick={() => void handleCheckout()} disabled={isCheckingOut}>
            {t('cart_checkout')}
          </CheckoutButton>
        </>
      )}
      <BackLink to="/">{t('back_to_store')}</BackLink>
    </Page>
  )
}
