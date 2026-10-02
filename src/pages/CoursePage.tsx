import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Page } from '../components/Page'

const CONTACT_EMAIL = 'kristian@svampskogen.com'

const Heading = styled.h1`
  font-size: 1.4rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 2rem;
`

const Notice = styled.section`
  width: min(560px, 90vw);
  text-align: left;
`

const BodyText = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-primary);
  line-height: 1.7;
  margin-bottom: 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const EmailLink = styled.a`
  color: var(--color-text-primary);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1px;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

export default function CoursePage() {
  const { t } = useTranslation()

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('course_page_heading')}</Heading>
      <Notice>
        <BodyText>{t('course_season_over')}</BodyText>
        <BodyText>
          {t('course_notify')} <EmailLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</EmailLink>.
        </BodyText>
      </Notice>
    </Page>
  )
}
