import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
`

const Title = styled.h1`
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: normal;
  letter-spacing: 0.05em;
  color: var(--color-accent);
  margin-bottom: 0.5rem;
`

const Subtitle = styled.p`
  font-size: clamp(0.9rem, 2vw, 1.1rem);
  color: var(--color-text-secondary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 3rem;
`

const Divider = styled.hr`
  width: 4rem;
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0 auto 3rem;
`

const Opening = styled.p`
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
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

const LangSwitcher = styled.div`
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  display: flex;
  gap: 0.5rem;
`

const LangButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  padding: 0;
  color: ${({ $active }) => ($active ? 'var(--color-accent)' : 'var(--color-text-secondary)')};
  border-bottom: 1px solid ${({ $active }) => ($active ? 'var(--color-accent)' : 'transparent')};
  transition: color 0.2s;

  &:hover {
    color: var(--color-accent);
  }
`

export default function App() {
  const { t, i18n } = useTranslation()

  return (
    <Page>
      <LangSwitcher>
        <LangButton $active={i18n.language === 'sv'} onClick={() => void i18n.changeLanguage('sv')}>SV</LangButton>
        <LangButton $active={i18n.language === 'en'} onClick={() => void i18n.changeLanguage('en')}>EN</LangButton>
      </LangSwitcher>
      <Title>Svampskogen</Title>
      <Subtitle>{t('subtitle')}</Subtitle>
      <Opening>{t('opening')}</Opening>
      <HoursLabel>{t('hours_heading')}</HoursLabel>
      <HoursDays>{t('hours_days_1')}</HoursDays>
      <HoursDays>{t('hours_days_2')}</HoursDays>
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
