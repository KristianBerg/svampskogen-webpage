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

const Intro = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  max-width: 560px;
  line-height: 1.7;
  margin-bottom: 2.5rem;
`

const Section = styled.section`
  width: min(560px, 90vw);
  text-align: left;
  margin-bottom: 2.5rem;
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

const FormBox = styled.div`
  border: 1px solid var(--color-border);
  padding: 1.5rem;
  font-size: 0.9rem;
`

const FormIntro = styled.p`
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
`

const FormStatement = styled.p`
  margin-bottom: 0.5rem;
`

const FormBlank = styled.div`
  border-bottom: 1px solid var(--color-border);
  height: 1.75rem;
  margin-bottom: 1.25rem;
`

const FormField = styled.div`
  margin-bottom: 1.25rem;
`

const FormLabel = styled.label`
  display: block;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
  color: var(--color-text-secondary);
  margin-bottom: 0.3rem;
`

const CompanyDetails = styled.address`
  font-style: normal;
  font-size: 0.95rem;
  line-height: 1.7;
`

const ExternalLink = styled.a`
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1px;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

const LinkList = styled.p`
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
`

export default function ReturnsPage() {
  const { t } = useTranslation()

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('returns_heading')}</Heading>
      <Intro>{t('returns_intro')}</Intro>

      <Section>
        <SectionHeading>{t('returns_withdrawal_heading')}</SectionHeading>
        <BodyText>{t('returns_withdrawal_p1')}</BodyText>
        <BodyText>{t('returns_withdrawal_p2')}</BodyText>
        <BodyText>{t('returns_withdrawal_p3')}</BodyText>
      </Section>

      <Section>
        <SectionHeading>{t('returns_how_heading')}</SectionHeading>
        <BodyText>{t('returns_how_p1')}</BodyText>
        <BodyText>{t('returns_how_p2')}</BodyText>
        <BodyText>{t('returns_how_p3')}</BodyText>
      </Section>

      <Section>
        <SectionHeading>{t('returns_form_heading')}</SectionHeading>
        <FormBox>
          <FormIntro>{t('returns_form_intro')}</FormIntro>
          <CompanyDetails style={{ marginBottom: '1.25rem' }}>
            Svampstugan AB (Svampskogen)
            <br />
            Claesgatan 8, 214 26 Malmö
            <br />
            kristian@svampskogen.com
          </CompanyDetails>
          <FormStatement>{t('returns_form_statement')}</FormStatement>
          <FormBlank />
          <FormBlank />
          <FormField>
            <FormLabel>{t('returns_form_ordered_on')}</FormLabel>
            <FormBlank />
          </FormField>
          <FormField>
            <FormLabel>{t('returns_form_received_on')}</FormLabel>
            <FormBlank />
          </FormField>
          <FormField>
            <FormLabel>{t('returns_form_name')}</FormLabel>
            <FormBlank />
          </FormField>
          <FormField>
            <FormLabel>{t('returns_form_address')}</FormLabel>
            <FormBlank />
          </FormField>
          <FormField>
            <FormLabel>{t('returns_form_signature')}</FormLabel>
            <FormBlank />
          </FormField>
          <FormField style={{ marginBottom: 0 }}>
            <FormLabel>{t('returns_form_date')}</FormLabel>
            <FormBlank style={{ marginBottom: 0 }} />
          </FormField>
        </FormBox>
      </Section>

      <Section>
        <SectionHeading>{t('returns_complaint_heading')}</SectionHeading>
        <BodyText>{t('returns_complaint_p1')}</BodyText>
        <BodyText>{t('returns_complaint_p2')}</BodyText>
      </Section>

      <Section>
        <SectionHeading>{t('returns_purchase_heading')}</SectionHeading>
        <BodyText>{t('returns_purchase_p1')}</BodyText>
        <BodyText>{t('returns_purchase_p2')}</BodyText>
        <BodyText>{t('returns_purchase_p3')}</BodyText>
      </Section>

      <Section>
        <SectionHeading>{t('returns_company_heading')}</SectionHeading>
        <CompanyDetails>
          Svampstugan AB (Svampskogen)
          <br />
          Org.nr 559583-9159
          <br />
          Claesgatan 8, 214 26 Malmö
          <br />
          kristian@svampskogen.com
        </CompanyDetails>
      </Section>

      <Section style={{ marginBottom: 0 }}>
        <SectionHeading>{t('returns_dispute_heading')}</SectionHeading>
        <BodyText>{t('returns_dispute_p1')}</BodyText>
        <LinkList>
          <ExternalLink href="https://www.arn.se" target="_blank" rel="noopener noreferrer">
            {t('returns_dispute_arn_link')}
          </ExternalLink>
          <ExternalLink href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
            {t('returns_dispute_odr_link')}
          </ExternalLink>
        </LinkList>
      </Section>
    </Page>
  )
}
