import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Page } from '../components/Page'
import { products } from '../data/products'
import { useCart } from '../hooks/useCart'
import { useProductPrices } from '../hooks/useProductPrices'
import { formatPrice } from '../lib/formatPrice'

const Heading = styled.h1`
  font-size: 1.4rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
`

const ProductImage = styled.img`
  display: block;
  width: min(320px, 90vw);
  aspect-ratio: 1;
  object-fit: cover;
  border: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
`

const Price = styled.p`
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
`

const BodyText = styled.p`
  font-size: 0.95rem;
  line-height: 1.7;
  max-width: 560px;
  margin-bottom: 1.5rem;
`

const AddToCartRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`

const QuantityInput = styled.input`
  width: 3.5rem;
  font-family: inherit;
  font-size: 0.9rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
`

const AddToCartButton = styled.button`
  font-family: inherit;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.6rem 1.25rem;
  border: 1px solid var(--color-text-primary);
  background: none;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

const BackLink = styled(Link)`
  color: var(--color-text-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
`

export default function ProductPage() {
  const { t, i18n } = useTranslation()
  const { slug } = useParams()
  const lang = i18n.language === 'sv' ? 'sv' : 'en'
  const product = products.find((candidate) => candidate.slug === slug)
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const prices = useProductPrices(product ? [product.stripePriceId] : [])

  if (!product) {
    return (
      <Page style={{ minHeight: '60vh' }}>
        <Heading>{t('product_not_found')}</Heading>
        <BackLink to="/store">{t('back_to_store')}</BackLink>
      </Page>
    )
  }

  const price = prices[product.stripePriceId]

  return (
    <Page style={{ minHeight: '60vh' }}>
      <ProductImage src={product.images[0]} alt={product.name[lang]} />
      <Heading>{product.name[lang]}</Heading>
      {price && <Price>{formatPrice(price)}</Price>}
      <BodyText>{product.description[lang]}</BodyText>
      <AddToCartRow>
        <QuantityInput
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
        />
        <AddToCartButton onClick={() => addItem(product.slug, quantity)}>{t('add_to_cart')}</AddToCartButton>
      </AddToCartRow>
      <BackLink to="/store">{t('back_to_store')}</BackLink>
    </Page>
  )
}
