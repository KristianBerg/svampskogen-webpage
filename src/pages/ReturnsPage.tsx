import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Page } from '../components/Page'

const Heading = styled.h1`
  font-size: 1.4rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
`

export default function ReturnsPage() {
  const { t } = useTranslation()

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('returns_heading')}</Heading>
      <p>{t('returns_body')}</p>
    </Page>
  )
}
