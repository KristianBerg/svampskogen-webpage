import { useTranslation } from 'react-i18next'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { Page } from '../components/Page'
import { unpublishedProducts } from '../data/unpublishedPreview'
import { getStoreListing, type StoreLinkState } from '../lib/storeListing'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../lib/formatPrice'
import { getProductImages } from '../lib/productImages'
import { usePageTitle } from '../hooks/usePageTitle'

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

const ProductImage = styled.img<{ $whole?: boolean }>`
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: ${({ $whole }) => ($whole ? 'contain' : 'cover')};
`

const ProductName = styled(Link)`
  color: var(--color-text-primary);
  text-decoration: none;
  font-size: 0.95rem;
  line-height: 1.4;
  /* Every name gets two lines, so prices and buttons line up across a row. */
  min-height: 2.8em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

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
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

const CategoryBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  width: min(960px, 92vw);
  margin-bottom: 1.5rem;
`

const CategoryButton = styled(AddToCartButton)`
  &[aria-pressed='true'],
  &[aria-pressed='true']:hover {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-background);
  }
`

export default function StorePage() {
  const { t, i18n } = useTranslation()
  usePageTitle()
  const lang = i18n.resolvedLanguage === 'sv' ? 'sv' : 'en'
  const { addItem } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const { search } = useLocation()
  const { inStockProducts, availableCategories, showUnpublished, activeCategoryId, visibleProducts } =
    getStoreListing(searchParams)
  const linkState: StoreLinkState = { storeSearch: search }

  const selectCategory = (categoryId: string | null) => {
    setSearchParams(categoryId ? { category: categoryId } : {}, { replace: true })
  }

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('store_heading')}</Heading>
      {inStockProducts.length === 0 && unpublishedProducts.length === 0 ? (
        <p>{t('store_coming_soon')}</p>
      ) : (
        <>
          {(availableCategories.length > 0 || unpublishedProducts.length > 0) && (
            <CategoryBar>
              <CategoryButton
                type="button"
                aria-pressed={activeCategoryId === null && !showUnpublished}
                onClick={() => selectCategory(null)}
              >
                {t('store_category_all')}
              </CategoryButton>
              {availableCategories.map((category) => (
                <CategoryButton
                  key={category.id}
                  type="button"
                  aria-pressed={activeCategoryId === category.id}
                  onClick={() => selectCategory(category.id)}
                >
                  {category.name[lang]}
                </CategoryButton>
              ))}
              {unpublishedProducts.length > 0 && (
                <CategoryButton
                  type="button"
                  aria-pressed={showUnpublished}
                  onClick={() => setSearchParams({ unpublished: '' }, { replace: true })}
                >
                  Unpublished ({unpublishedProducts.length})
                </CategoryButton>
              )}
            </CategoryBar>
          )}
          <ProductGrid>
            {visibleProducts.map((product) => (
              <ProductCard key={product.slug}>
                <ProductImageLink to={`/store/${product.slug}`} state={linkState}>
                  <ProductImage
                    src={getProductImages(product)[0].thumb}
                    alt={product.name[lang]}
                    loading="lazy"
                    $whole={product.wholeImage}
                  />
                </ProductImageLink>
                <ProductName to={`/store/${product.slug}`} state={linkState}>{product.name[lang]}</ProductName>
                <ProductPrice>{formatPrice(product.priceOre)}</ProductPrice>
                {!product.published ? (
                  <ProductPrice>Unpublished</ProductPrice>
                ) : product.variants?.length ? (
                  <AddToCartButton as={Link} to={`/store/${product.slug}`} state={linkState}>
                    {t('choose_options')}
                  </AddToCartButton>
                ) : (
                  <AddToCartButton onClick={() => addItem(product.slug)}>{t('add_to_cart')}</AddToCartButton>
                )}
              </ProductCard>
            ))}
          </ProductGrid>
        </>
      )}
    </Page>
  )
}
