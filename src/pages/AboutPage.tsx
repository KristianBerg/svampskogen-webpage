import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Page } from '../components/Page'

const Divider = styled.hr`
  width: 4rem;
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0 auto 3rem;
`

const HoursLabel = styled.p`
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-top: 1.5rem;
  margin-bottom: 0.4rem;
`

const HoursDays = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-primary);
  margin-bottom: 0;
`

const Location = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  margin-bottom: 3rem;
`

const Contact = styled.a`
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

const Section = styled.div`
  width: min(560px, 90vw);
  text-align: left;
  margin-bottom: 3rem;
`

const SectionHeading = styled.h2`
  font-size: 0.8rem;
  font-weight: normal;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
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

const MapWrapper = styled.div`
  margin-top: 3rem;
  width: min(480px, 90vw);
  aspect-ratio: 4 / 3;
  border: 1px solid var(--color-border);

  iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
    filter: grayscale(30%);
  }
`

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <Page>
      <HoursLabel style={{ marginTop: '2rem' }}>{t('hours_heading')}</HoursLabel>
      <HoursDays>{t('hours_days_1')}</HoursDays>
      <HoursDays>{t('hours_days_2')}</HoursDays>
      <HoursDays>{t('hours_days_3')}</HoursDays>
      <Divider style={{ marginTop: '2rem' }} />
      <Section>
        <BodyText>{t('about_p1')}</BodyText>
        <BodyText>{t('about_p2')}</BodyText>
        <BodyText>{t('about_p3')}</BodyText>
      </Section>
      <Section>
        <SectionHeading>{t('suppliers_heading')}</SectionHeading>
        <BodyText>{t('suppliers_p1')}</BodyText>
      </Section>
      <Divider />
      <Location>{t('location')}</Location>
      <Contact href="mailto:kristian@svampskogen.com">kristian@svampskogen.com</Contact>
      <Contact href="https://instagram.com/svampskogen_malmo" target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.75rem' }}>@svampskogen_malmo</Contact>
      <Contact href="https://maps.app.goo.gl/mXn7tpBWJwmRNEf89" target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.75rem' }}>{t('gbp_link')}</Contact>
      <MapWrapper>
        <iframe
          src="https://maps.google.com/maps?q=Claesgatan+8%2C+214+26+Malm%C3%B6%2C+Sweden&output=embed"
          title="Svampskogen location"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </MapWrapper>
    </Page>
  )
}
