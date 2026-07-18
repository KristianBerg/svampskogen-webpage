import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
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

const BodyText = styled.p`
  font-size: 0.95rem;
  line-height: 1.7;
  max-width: 560px;
  margin-bottom: 1.5rem;
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

  if (!product) {
    return (
      <Page style={{ minHeight: '60vh' }}>
        <Heading>{t('product_not_found')}</Heading>
        <BackLink to="/store">{t('back_to_store')}</BackLink>
      </Page>
    )
  }

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{product.name[lang]}</Heading>
      <BodyText>{product.description[lang]}</BodyText>
      <BackLink to="/store">{t('back_to_store')}</BackLink>
    </Page>
  )
}
