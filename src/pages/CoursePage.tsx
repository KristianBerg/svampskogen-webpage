import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { Page } from '../components/Page'

const FOREST_SIGNUP_URL = 'https://forms.gle/kHKPecGfUpDTbDU96'
const PARK_SIGNUP_URL = 'https://forms.gle/6qpctsUzPH5VFokHA'

const Heading = styled.h1`
  font-size: 1.4rem;
  font-weight: normal;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 2rem;
`

const Offering = styled.section`
  width: min(560px, 90vw);
  text-align: left;
  margin-bottom: 2.5rem;

  &:not(:last-child) {
    padding-bottom: 2.5rem;
    border-bottom: 1px solid var(--color-border);
  }
`

const OfferingTitle = styled.h2`
  font-size: 1rem;
  font-weight: normal;
  letter-spacing: 0.06em;
  margin-bottom: 0.75rem;
`

const OfferingBody = styled.p`
  font-size: 0.95rem;
  color: var(--color-text-primary);
  line-height: 1.7;
  margin-bottom: 1.25rem;
`

const SignUpLink = styled.a`
  display: inline-block;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.7rem 1.75rem;
  border: 1px solid var(--color-accent);
  background: var(--color-accent);
  color: var(--color-background);
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`

const BookingNote = styled.p`
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
`

const Details = styled.details`
  margin-top: 1.25rem;

  summary {
    cursor: pointer;
    list-style: none;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    transition: color 0.2s;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: ' ▸';
  }

  &[open] summary::after {
    content: ' ▾';
  }

  summary:hover {
    color: var(--color-accent);
  }
`

const DetailsBody = styled.div`
  margin-top: 1rem;
`

const SubHeading = styled.h3`
  font-size: 0.85rem;
  font-weight: normal;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin: 1.5rem 0 0.5rem;

  &:first-child {
    margin-top: 0;
  }
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

const PlainList = styled.ul`
  font-size: 0.95rem;
  color: var(--color-text-primary);
  line-height: 1.7;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
`

export default function CoursePage() {
  const { t } = useTranslation()

  return (
    <Page style={{ minHeight: '60vh' }}>
      <Heading>{t('course_page_heading')}</Heading>

      <Offering>
        <OfferingTitle>{t('course_forest_title')}</OfferingTitle>
        <OfferingBody>{t('course_body')}</OfferingBody>
        <SignUpLink href={FOREST_SIGNUP_URL} target="_blank" rel="noopener noreferrer">
          {t('course_link_label')}
        </SignUpLink>
        <Details>
          <summary>{t('course_details_toggle')}</summary>
          <DetailsBody>
            <SubHeading>{t('course_practical_heading')}</SubHeading>
            <BodyText>{t('course_details_logistics')}</BodyText>

            <SubHeading>{t('course_bring_heading')}</SubHeading>
            <PlainList>
              <li>{t('course_bring_1')}</li>
              <li>{t('course_bring_2')}</li>
              <li>{t('course_bring_3')}</li>
            </PlainList>

            <BodyText>{t('course_cost')}</BodyText>
            <BodyText>{t('course_questions')}</BodyText>
          </DetailsBody>
        </Details>
      </Offering>

      <Offering>
        <OfferingTitle>{t('course_park_title')}</OfferingTitle>
        <OfferingBody>{t('course_park_body')}</OfferingBody>
        <SignUpLink href={PARK_SIGNUP_URL} target="_blank" rel="noopener noreferrer">
          {t('course_link_label')}
        </SignUpLink>
        <BookingNote>{t('course_park_booking_note')}</BookingNote>
        <Details>
          <summary>{t('course_details_toggle')}</summary>
          <DetailsBody>
            <SubHeading>{t('course_park_dates_heading')}</SubHeading>
            <PlainList>
              <li>{t('course_park_date_1')}</li>
              <li>{t('course_park_date_2')}</li>
              <li>{t('course_park_date_3')}</li>
            </PlainList>

            <BodyText>{t('course_park_practical')}</BodyText>
            <BodyText>{t('course_questions')}</BodyText>
          </DetailsBody>
        </Details>
      </Offering>
    </Page>
  )
}
