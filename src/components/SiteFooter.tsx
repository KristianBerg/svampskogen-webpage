import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

const Footer = styled.footer`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
`

const CompanyHeading = styled.p`
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
`

const CompanyDetails = styled.p`
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-align: center;
  margin-bottom: 0.5rem;
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
      <CompanyHeading>{t('footer_company_heading')}</CompanyHeading>
      <CompanyDetails>
        Svampstugan AB
        <br />
        Org.nr 559583-9159
      </CompanyDetails>
      <FooterLink to="/returns">{t('footer_returns_link')}</FooterLink>
    </Footer>
  )
}
