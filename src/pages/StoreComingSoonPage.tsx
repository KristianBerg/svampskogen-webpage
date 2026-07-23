import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Page } from '../components/Page'

const Heading = styled.h1`
  font-size: 1.4rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
`

const BackLink = styled(Link)`
  color: var(--color-text-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
  margin-top: 1.5rem;
`

export default function StoreComingSoonPage() {
  const { t } = useTranslation()

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('store_heading')}</Heading>
      <p>{t('store_coming_soon')}</p>
      <BackLink to="/">{t('back_to_home')}</BackLink>
    </Page>
  )
}
