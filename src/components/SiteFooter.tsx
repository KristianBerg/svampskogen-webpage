import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

const Footer = styled.footer`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 1rem;
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 300px));
    justify-content: center;
    align-items: start;
    gap: 2rem;
  }
`

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`

const FooterHeading = styled.p`
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
`

const FooterDetails = styled.p`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: 0.5rem;
`

const OrgNumber = styled.span`
  user-select: all;
`

const FooterLink = styled(Link)`
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2px;

  &:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
`

export function SiteFooter() {
  const { t } = useTranslation()

  return (
    <Footer>
      <FooterColumn>
        <FooterHeading>{t('hours_heading')}</FooterHeading>
        <FooterDetails>
          {t('hours_days_1')}
          <br />
          {t('hours_days_2')}
          <br />
          {t('hours_days_3')}
          <br />
          {t('hours_days_4')}
        </FooterDetails>
      </FooterColumn>
      <FooterColumn>
        <FooterHeading>{t('footer_company_heading')}</FooterHeading>
        <FooterDetails>
          Svampstugan AB
          <br />
          Claesgatan 8, 214 26 Malmö
          <br />
          Org.nr <OrgNumber>559583-9159</OrgNumber>
          <br />
          {t('company_vat_label')} <OrgNumber>SE559583915901</OrgNumber>
          <br />
          kristian@svampskogen.com
        </FooterDetails>
      </FooterColumn>
      <FooterColumn>
        <FooterHeading>{t('footer_links_heading')}</FooterHeading>
        <FooterLink to="/returns">{t('footer_returns_link')}</FooterLink>
        <FooterLink to="/withdraw">{t('withdraw_link')}</FooterLink>
        <FooterLink to="/privacy">{t('footer_privacy_link')}</FooterLink>
      </FooterColumn>
    </Footer>
  )
}
