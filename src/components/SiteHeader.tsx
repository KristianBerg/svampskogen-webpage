import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import logotype from '../assets/logo/svampskogen-logotype.png'
import heroImage from '../assets/hero/purple-moss.jpg'

const Hero = styled.div`
  --color-text-secondary: #e4ddd0;

  width: 100%;
  height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  background-image: linear-gradient(180deg, rgba(18, 20, 14, 0.4), rgba(18, 20, 14, 0.65)), url(${heroImage});
  /* The photo stays at its own size, so its zoom doesn't change with the window;
     a wider window only shows more of it. Scales up only past the photo's width. */
  background-size: 100% 100%, max(2000px, 100%) auto;
  /* Keeps the mushroom cluster left of centre in view. */
  background-position: center, 35% 20%;
  background-repeat: no-repeat;

  /* Bottom-aligned on phones so the logo sits clear of the fixed cart and language buttons. */
  @media (max-width: 600px) {
    height: 250px;
    justify-content: flex-end;
    padding-bottom: 1.5rem;
  }
`

const Logo = styled.img`
  width: min(205px, 43vw);
  height: auto;
`

const Subtitle = styled.p`
  font-size: clamp(0.8rem, 1.6vw, 1rem);
  color: var(--color-text-secondary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-top: 1rem;

  @media (max-width: 600px) {
    margin-top: 0.75rem;
  }
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
        <Logo src={logotype} alt="Svampskogen" width={1035} height={754} />
        <Subtitle>{t('subtitle')}</Subtitle>
      </Hero>
      <NavRow>
        <NavLink to="/" $active={pathname === '/' || pathname.startsWith('/store')}>{t('nav_store')}</NavLink>
        <NavLink to="/course" $active={pathname.startsWith('/course')}>{t('nav_course')}</NavLink>
        <NavLink to="/about" $active={pathname.startsWith('/about')}>{t('nav_about')}</NavLink>
      </NavRow>
    </>
  )
}
