import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Page } from '../components/Page'
import { usePageTitle } from '../hooks/usePageTitle'

const Heading = styled.h1`
  font-size: 1.4rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
`

const Intro = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  max-width: 560px;
  line-height: 1.7;
  margin-bottom: 0.75rem;
`

const Updated = styled.p`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 2.5rem;
`

const Section = styled.section`
  width: min(560px, 90vw);
  text-align: left;
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const SectionHeading = styled.h2`
  font-size: 0.85rem;
  font-weight: normal;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: 1rem;
`

const BodyText = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-primary);
  line-height: 1.7;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const SECTIONS = [
  { heading: 'privacy_controller_heading', paragraphs: ['privacy_controller_p1'] },
  {
    heading: 'privacy_data_heading',
    paragraphs: ['privacy_data_p1', 'privacy_data_p2', 'privacy_data_p3', 'privacy_data_p4'],
  },
  {
    heading: 'privacy_purpose_heading',
    paragraphs: ['privacy_purpose_p1', 'privacy_purpose_p2', 'privacy_purpose_p3', 'privacy_purpose_p4'],
  },
  { heading: 'privacy_recipients_heading', paragraphs: ['privacy_recipients_p1', 'privacy_recipients_p2'] },
  { heading: 'privacy_transfers_heading', paragraphs: ['privacy_transfers_p1'] },
  { heading: 'privacy_retention_heading', paragraphs: ['privacy_retention_p1', 'privacy_retention_p2'] },
  { heading: 'privacy_storage_heading', paragraphs: ['privacy_storage_p1'] },
  { heading: 'privacy_rights_heading', paragraphs: ['privacy_rights_p1', 'privacy_rights_p2'] },
]

export default function PrivacyPage() {
  const { t } = useTranslation()
  usePageTitle(t('privacy_heading'))

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('privacy_heading')}</Heading>
      <Intro>{t('privacy_intro')}</Intro>
      <Updated>{t('privacy_updated')}</Updated>
      {SECTIONS.map(({ heading, paragraphs }) => (
        <Section key={heading}>
          <SectionHeading>{t(heading)}</SectionHeading>
          {paragraphs.map((paragraph) => (
            <BodyText key={paragraph}>{t(paragraph)}</BodyText>
          ))}
        </Section>
      ))}
    </Page>
  )
}
