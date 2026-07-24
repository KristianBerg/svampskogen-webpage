import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

const Footer = styled.footer`
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
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
      <FooterLink to="/returns">{t('footer_returns_link')}</FooterLink>
    </Footer>
  )
}
