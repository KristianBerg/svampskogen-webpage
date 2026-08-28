import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Page } from '../components/Page'

const SIGNUP_URL = 'https://forms.gle/kHKPecGfUpDTbDU96'

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
  margin-bottom: 1.5rem;
`

const SignUpLink = styled.a`
  font-size: 0.95rem;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;
  margin-bottom: 3rem;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
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

const SubHeading = styled.h3`
  font-size: 0.9rem;
  font-weight: normal;
  color: var(--color-text-primary);
  margin: 1.5rem 0 0.5rem;
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

const BringList = styled.ul`
  font-size: 0.95rem;
  color: var(--color-text-primary);
  line-height: 1.7;
  padding-left: 1.25rem;
  margin-bottom: 1.5rem;
`

export default function CoursePage() {
  const { t } = useTranslation()

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('course_heading')}</Heading>
      <Intro>{t('course_body')}</Intro>
      <SignUpLink href={SIGNUP_URL} target="_blank" rel="noopener noreferrer">
        {t('course_link_label')}
      </SignUpLink>

      <Section>
        <SectionHeading>{t('course_practical_heading')}</SectionHeading>
        <BodyText>{t('course_details_logistics')}</BodyText>

        <SubHeading>{t('course_bring_heading')}</SubHeading>
        <BringList>
          <li>{t('course_bring_1')}</li>
          <li>{t('course_bring_2')}</li>
          <li>{t('course_bring_3')}</li>
        </BringList>

        <BodyText>{t('course_cost')}</BodyText>
        <BodyText>{t('course_questions')}</BodyText>
      </Section>
    </Page>
  )
}
