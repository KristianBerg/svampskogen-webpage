import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Page } from '../components/Page'
import { products } from '../data/products'

const Heading = styled.h1`
  font-size: 1.4rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
`

const ProductList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const ProductLink = styled(Link)`
  color: var(--color-text-primary);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

export default function StorePage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'sv' ? 'sv' : 'en'

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('store_heading')}</Heading>
      {products.length === 0 ? (
        <p>{t('store_coming_soon')}</p>
      ) : (
        <ProductList>
          {products.filter((product) => product.inStock).map((product) => (
            <li key={product.slug}>
              <ProductLink to={`/store/${product.slug}`}>{product.name[lang]}</ProductLink>
            </li>
          ))}
        </ProductList>
      )}
    </Page>
  )
}
