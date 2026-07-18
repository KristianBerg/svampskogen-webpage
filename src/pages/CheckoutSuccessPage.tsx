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

export default function CheckoutSuccessPage() {
  const { t } = useTranslation()

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('checkout_success_heading')}</Heading>
      <p>{t('checkout_success_body')}</p>
      <BackLink to="/store">{t('back_to_store')}</BackLink>
    </Page>
  )
}
