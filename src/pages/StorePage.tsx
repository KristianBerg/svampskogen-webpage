import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 2rem;
  width: min(960px, 92vw);
`

const ProductCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const ProductImageLink = styled(Link)`
  display: block;
  border: 1px solid var(--color-border);

  &:hover {
    border-color: var(--color-accent);
  }
`

const ProductImage = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
`

const ProductName = styled(Link)`
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 0.95rem;

  &:hover {
    color: var(--color-accent);
  }
`

const ProductPrice = styled.span`
  color: var(--color-text-secondary);
  font-size: 0.9rem;
`

const AddToCartButton = styled.button`
  font-family: inherit;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.5rem 0.75rem;
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

export default function StorePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'sv' ? 'sv' : 'en'
  const { addItem } = useCart()
  const inStockProducts = products.filter((product) => product.inStock)
  const prices = useProductPrices(inStockProducts.map((product) => product.stripePriceId))

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('store_heading')}</Heading>
      {inStockProducts.length === 0 ? (
        <p>{t('store_coming_soon')}</p>
      ) : (
        <ProductGrid>
          {inStockProducts.map((product) => {
            const price = prices[product.stripePriceId]
            return (
              <ProductCard key={product.slug}>
                <ProductImageLink to={`/store/${product.slug}`}>
                  <ProductImage src={product.images[0]} alt={product.name[lang]} />
                </ProductImageLink>
                <ProductName to={`/store/${product.slug}`}>{product.name[lang]}</ProductName>
                {price && <ProductPrice>{formatPrice(price)}</ProductPrice>}
                <AddToCartButton onClick={() => addItem(product.slug)}>{t('add_to_cart')}</AddToCartButton>
              </ProductCard>
            )
          })}
        </ProductGrid>
      )}
    </Page>
  )
}
