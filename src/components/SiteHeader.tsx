import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import logotype from '../assets/logo/svampskogen-logotype.png'
import heroImage from '../assets/hero/purple-moss.jpg'

const Hero = styled.div`
  --color-text-secondary: #e4ddd0;

  width: 100%;
  min-height: 28vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  background-image: linear-gradient(180deg, rgba(18, 20, 14, 0.4), rgba(18, 20, 14, 0.65)), url(${heroImage});
  background-size: cover;
  background-position: center 15%;
`

const Logo = styled.img`
  width: min(260px, 55vw);
  height: auto;
`

const Subtitle = styled.p`
  font-size: clamp(0.8rem, 1.6vw, 1rem);
  color: var(--color-text-secondary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: 1rem;
`

const NavRow = styled.nav`
  display: flex;
  justify-content: center;
  gap: 2rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--color-border);
`

const NavLink = styled(Link)<{ $active: boolean }>`
  font-size: 0.9rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  padding-bottom: 2px;
  color: ${({ $active }) => ($active ? 'var(--color-accent)' : 'var(--color-text-secondary)')};
  border-bottom: 1px solid ${({ $active }) => ($active ? 'var(--color-accent)' : 'transparent')};
  transition: color 0.2s;

  &:hover {
    color: var(--color-accent);
  }
`

export function SiteHeader() {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <>
      <Hero>
        <Logo src={logotype} alt="Svampskogen" />
        <Subtitle>{t('subtitle')}</Subtitle>
      </Hero>
      <NavRow>
        <NavLink to="/store" $active={pathname.startsWith('/store')}>{t('nav_store')}</NavLink>
        <NavLink to="/" $active={pathname === '/'}>{t('nav_about')}</NavLink>
      </NavRow>
    </>
  )
}
